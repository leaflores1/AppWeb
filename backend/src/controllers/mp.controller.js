import axios from "axios";
import Seller from "../models/seller.model.js";
import { User } from "../models/user.model.js";

export const connectSeller = (req, res) => {
  const sellerId = req.params.sellerId;
  const { CLIENT_ID, MP_REDIRECT_URI } = process.env;
  
  //console.log(CLIENT_ID);
  
  const mpAuthUrl = `https://auth.mercadopago.com/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&state=${sellerId}&redirect_uri=${encodeURIComponent(MP_REDIRECT_URI)}`;
  console.log("Redirigiendo a MP OAuth:", mpAuthUrl);
  return res.redirect(mpAuthUrl);
};

export const handleCallback = async (req, res) => {
  const { code, state } = req.query;
  const sellerId = state;

  if (!code || !state) {
    return res.status(400).send("Falta 'code' o 'state' en la redirección.");
  }

  try {
    const { CLIENT_ID, CLIENT_SECRET, MP_REDIRECT_URI } = process.env;
    const tokenUrl = "https://api.mercadopago.com/oauth/token";
    
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: MP_REDIRECT_URI,
    });
    
    const mpResponse = await axios.post(tokenUrl, body, {
      withCredentials: true,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    
    const { access_token, refresh_token, user_id, expires_in } = mpResponse.data;
    
    const siteId = await getSellerSiteId(user_id, access_token);
    
    if (!siteId) {
      console.error("❌ No se recibió site_id en la respuesta de Mercado Pago.");
      return res.status(500).send("No se pudo obtener el site_id del vendedor.");
    }
    
    const existingSeller = await Seller.findOne({ sellerId });
    if (existingSeller) {
      existingSeller.access_token = access_token;
      existingSeller.refresh_token = refresh_token;
      existingSeller.user_id = user_id;
      existingSeller.site_id = siteId;
      existingSeller.expires_in = expires_in;
      existingSeller.obtained_at = new Date();
      await existingSeller.save();
    } else {
      const newSeller = new Seller({
        sellerId,
        access_token,
        refresh_token,
        user_id,
        expires_in,
        site_id: siteId,
      });
      await newSeller.save();
    }
    
    const user = await User.findOneAndUpdate(
      { username: state },
      { sellerId: state, mpUserId: user_id },
      { new: true }
    );

    if (!user) {
      return res.status(404).send("Usuario no encontrado.");
    }
    
    // Redirigir al perfil del vendedor con un parámetro de mensaje
    return res.redirect(`https://localhost:3000.com/${sellerId}?mpLinked=1`);
  } catch (error) {
    console.error(
      "Error en handleCallback:",
      error.response?.data || error.message
    );
    return res.status(500).send("Error en /api/mp/callback");
  }
};



export const getSellerSiteId = async (userId, accessToken) => {
  try {
    const response = await axios.get(
      `https://api.mercadopago.com/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data.site_id;
  } catch (error) {
    console.error("Error al obtener el site_id:", error.response?.data || error.message);
    return null;
  }
};

export const createPreference = async (req, res) => {
  const sellerId = req.params.sellerId;
  const { title, unit_price, quantity, marketplace_fee } = req.body;

  try {
    const sellerData = await Seller.findOne({ sellerId });
    if (!sellerData || !sellerData.access_token) {
      return res.status(400).send("Este vendedor no está conectado vía OAuth.");
    }
    const accessToken = sellerData.access_token;

    const currencyMapping = {
      "MLA": "ARS", "MLB": "BRL", "MLC": "CLP", "MCO": "COP",
      "MLM": "MXN", "MPE": "PEN", "MLU": "UYU"
    };
    
    const currency_id = currencyMapping[sellerData.site_id] || "ARS";

    const preferencePayload = {
      items: [{ title, quantity, unit_price, currency_id }],
      marketplace_fee,
      back_urls: {
        success: `${process.env.MARKETPLACE_BASE_URL}/api/success`,
        failure: `${process.env.MARKETPLACE_BASE_URL}/api/failure`,
      },
    };

    const mpRes = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      preferencePayload,
      {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      }
    );

    return res.json(mpRes.data);
  } catch (error) {
    console.error("Error al crear preferencia:", error.response?.data || error.message);
    return res.status(500).send("Error al crear preferencia");
  }
};
