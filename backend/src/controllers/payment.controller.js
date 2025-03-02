import mercadopago from "mercadopago";
import { User } from "../models/user.model.js";
import { Photo } from "../models/photo.model.js";
import { Album } from "../models/album.model.js";
import Seller from "../models/seller.model.js";

export const createOrder = async (req, res) => {
  //console.log("createOrder endpoint hit");

  try {
    const { photoId, albumId, unit_price, title, quantity, marketplace_fee, amount } = req.body;
    //console.log("Datos de preferencia recibidos:", { photoId, albumId, unit_price, title, quantity, marketplace_fee, amount });

    if (!req.user) {
      console.error("Usuario no autenticado");
      return res.status(401).json({ message: "Usuario no autenticado" });
    }
    //console.log("Usuario autenticado:", req.user);

    let sellerUsername;
    let seller;

    if (photoId && !albumId) {
      // Caso 1: Compra de foto individual
      const photo = await Photo.findById(photoId);
      if (!photo) {
        console.error("Foto no encontrada:", photoId);
        return res.status(404).json({ message: "Foto no encontrada" });
      }
      //console.log("Foto encontrada:", photo);
      sellerUsername = photo.username;

    } else if (albumId) {

      // Caso 2: Compra de álbum completo
      const album = await Album.findById(albumId).populate("photos");
      if (!album) {
        console.error("Álbum no encontrado:", albumId);
        return res.status(404).json({ message: "Álbum no encontrado" });
      }
      //console.log("Álbum encontrado:", album);
      if (album.photos.length === 0) {
        return res.status(400).json({ message: "El álbum no contiene fotos." });
      }
   
  sellerUsername = album.username; // El creador del álbum

    } else {
      console.error("Ni photoId ni albumId proporcionado");
      return res.status(400).json({ message: "Se requiere photoId o albumId" });
    }

    // Buscar el vendedor
    seller = await Seller.findOne({ sellerId: sellerUsername });
    if (!seller || !seller.access_token) {
      console.error("Vendedor no vinculado a Mercado Pago:", sellerUsername);
      return res.status(400).json({ message: "El vendedor no está vinculado a Mercado Pago." });
    }
    //console.log("Vendedor encontrado:", seller);

    // Configurar Mercado Pago con el access_token del vendedor
    mercadopago.configure({
      access_token: seller.access_token,
    });

    // Crear la preferencia en Mercado Pago
    const result = await mercadopago.preferences.create({
      items: [
        {
          title,
          quantity: 1,
          unit_price: parseFloat(amount),
        },
      ],
      metadata: {
        ...(photoId ? { photo_id: photoId } : { album_id: albumId }),
        user_id: req.user.id,
        seller: sellerUsername,
      },
      marketplace_fee,
      notification_url: "https://localhost:3000.com/api/payment/webhook",
      back_urls: {
        success: `https://localhost:3000.com/api/payment/success?seller=${sellerUsername}`,
        pending: `https://localhost:3000.com/api/payment/pending?seller=${sellerUsername}`,
        failure: `https://localhost:3000.com/api/payment/failure?seller=${sellerUsername}`,
      },
    });

    //console.log("Preferencia creada exitosamente. Init_point:", result.body.init_point);
    return res.json(result.body);
  } catch (error) {
    console.error("Error al crear la preferencia:", error);
    return res.status(500).json({ message: "Error al crear la preferencia" });
  }
};
export const receiveWebhook = async (req, res) => {
  try {
    const topic = req.query.topic || req.query.type;
    const mpId = req.query.id || req.query["data.id"];

    if (!topic || !mpId) {
      console.warn("⚠️ Notificación inválida:", req.query);
      return res.status(400).json({ message: "Notificación inválida" });
    }

    switch (topic) {
      case "payment": {
        const { body } = await mercadopago.payment.findById(mpId);

        if (body.status === "approved") {
          const { photo_id, album_id, user_id } = body.metadata || {};
          //console.log("✅ Metadata recibida en webhook:", body.metadata);

          if (!user_id) {
            console.error("❌ Faltan datos en metadata para desbloquear contenido.");
            return res.status(400).json({ message: "Faltan datos en metadata" });
          }

          const userDoc = await User.findById(user_id);
          if (!userDoc) {
            console.error("❌ Usuario no encontrado:", user_id);
            return res.status(404).json({ message: "Usuario no encontrado" });
          }

          const updates = [];

          if (photo_id) {
            const photoDoc = await Photo.findById(photo_id);
            if (!photoDoc) {
              console.error("❌ Foto no encontrada:", photo_id);
              return res.status(404).json({ message: "Foto no encontrada" });
            }

            //console.log(`🔓 Desbloqueando foto ${photo_id} para usuario ${user_id}`);

            // 🔹 Actualiza el usuario (User) y la foto (Photo)
            updates.push(
              User.updateOne(
                { _id: user_id },
                { $addToSet: { unlockedPhotos: photo_id } }
              ),
              Photo.updateOne(
                { _id: photo_id },
                { $addToSet: { unlockedBy: user_id } }
              )
            );
          } 
          
          else if (album_id) {
            const albumDoc = await Album.findById(album_id).populate("photos");
            if (!albumDoc) {
              console.error("❌ Álbum no encontrado:", album_id);
              return res.status(404).json({ message: "Álbum no encontrado" });
            }

            //console.log(`🔓 Desbloqueando álbum ${album_id} y sus fotos para usuario ${user_id}`);

            // 🔹 Desbloquear álbum en User
            updates.push(
              Album.updateOne(
                { _id: album_id },
                { $addToSet: { unlockedBy: user_id } }
              )
            );

            for (const photo of albumDoc.photos) {
              if (photo.isPaidContent) {
                updates.push(
                  User.updateOne(
                    { _id: user_id },
                    { $addToSet: { unlockedPhotos: photo._id } }
                  ),
                  Photo.updateOne(
                    { _id: photo._id },
                    { $addToSet: { unlockedBy: user_id } }
                  )
                );
              }
            }
          }

          // 🔹 Ejecuta todas las actualizaciones en paralelo
          await Promise.all(updates);

          //console.log(`✅ Contenido desbloqueado para usuario ${user_id}`);
        }
        break;
      }

      default:
        //console.log("⚠️ Evento no manejado:", topic);
        return res.status(400).json({ message: "Evento no manejado" });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error("❌ Error al procesar la notificación:", error);
    res.status(500).json({ message: "Error en el webhook" });
  }
};