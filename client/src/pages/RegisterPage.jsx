import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Card, Message, Input } from "../components/ui";
import { useForm } from "react-hook-form";
import { registerSchema } from "../schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";

function Register() {
  const { signup, errors: registerErrors, isAuthenticated, user } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });
  const navigate = useNavigate();

  const onSubmit = async (value) => {
    try {
      await signup(value);
    } catch (error) {
      // Manejar errores del backend
      console.error("Error en el registro:", error);
      if (error.response?.data?.message) {
        // Mostrar mensaje de error en el campo correspondiente
        setError("username", {
          type: "manual",
          message: error.response.data.message,
        });
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) navigate(`/${user.username}/gallery`);
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black pt-16">
      <Card>
        {registerErrors.map((error, i) => (
          <Message message={error} key={i} />
        ))}

        <div className="flex justify-center mb-6">
          <Link to="/">
            <img
              src="/instagram-logo.png"
              alt="Logo"
              className="h-16 w-80 object-contain"
            />
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          {/*<Label htmlFor="username">Username:</Label>*/}
          <Input
            className="border border-white"
            type="text"
            name="username"
            placeholder="nombre de usuario"
            {...register("username")}
            autoFocus
          />
          {errors.username?.message && (
            <p className="text-red-500">{errors.username?.message}</p>
          )}
          <Input
            type="text"
            name="nombre"
            placeholder="nombre completo"
            {...register("nombre")}
          />
          <Input
            name="email"
            placeholder="correo electrónico"
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="text-red-500">{errors.email?.message}</p>
          )}
          {/* Nuevo campo opcional para Instagram */}
          <Input
            type="text"
            name="instagram"
            placeholder="Usuario de Instagram (opcional)"
            {...register("instagram")}
          />

          <Input
            type="password"
            name="password"
            placeholder="contraseña"
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="text-red-500">{errors.password?.message}</p>
          )}
          <Input
            type="password"
            name="confirmPassword"
            placeholder="confirmar contraseña"
            {...register("confirmPassword")}
          />

          {errors.confirmPassword?.message && (
            <p className="text-red-500">{errors.confirmPassword?.message}</p>
          )}
          <p className="pt-4 text-sm text-center font-regular">
            Al registrarte, aceptas nuestras{" "}
            <span className="font-light">
              Condiciones, la Política de privacidad y la Política de cookies.
            </span>{" "}
          </p>

          <button
            type="submit"
            className="bg-sky-600 text-white px-4 py-2 rounded-md my-4 hover:bg-sky-800 
             w-full max-w-xs mx-auto">
            Registrarte
          </button>
        </form>
      </Card>

      {/* Contenedor para "¿No tienes una cuenta?" */}
      <div className="bg-[#29b7f8] max-w-md w-full p-4 rounded-md m-4 text-center">
        <p>
          ¿Tienes una cuenta?
          <Link to="/login" className="text-blue-800">
            {" "}
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
