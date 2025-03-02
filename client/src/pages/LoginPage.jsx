// LoginPage.jsx

import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, Message, Input } from "../components/ui";
import { loginSchema } from "../schemas/auth";

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // 'loginErrors' se mostrará en la interfaz
  const { signin, errors: loginErrors, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    // data = { identifier: "...", password: "..." }
    await signin(data);
  };

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      navigate(`/${user.username}/gallery`);
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="h-[calc(115vh-100px)] flex flex-col items-center justify-center">
      <Card>
        {/* Mostrar errores globales del AuthContext */}
        {loginErrors.length > 0 &&
          loginErrors.map((error, i) => (
            <Message message={error} key={i} />
          ))}

        <div className="flex justify-center mb-2">
          <Link to="/">
            <img
              src="/instagram-logo.png"
              alt="Logo"
              className="h-16 w-80 object-contain"
            />
          </Link>
        </div>
        <p className="text-white text-center mb-6 text-sm italic font-light">
          Sin miedo, sin límites: tu contenido, tus reglas
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <Input
            label="Correo o Usuario"
            type="text"
            name="identifier"
            placeholder="Usuario o correo electrónico"
            {...register("identifier")}
          />
          {errors.identifier?.message && (
            <p className="text-red-500">{errors.identifier?.message}</p>
          )}

          <Input
            type="password"
            name="password"
            placeholder="Contraseña"
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="text-red-500">{errors.password?.message}</p>
          )}

          <button
            type="submit"
            className="bg-sky-600 text-white px-4 py-2 rounded-md my-4 hover:bg-sky-800 
             w-full max-w-xs mx-auto">
            Iniciar sesión
          </button>
        </form>

        <Link
          to="/forgot-password"
          className="text-sm text-white mt-4 flex justify-center"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </Card>

      <div className="bg-[#29b7f8] max-w-md w-full p-4 rounded-md m-6 wt-4 text-center">
        <p>
          ¿No tienes una cuenta?
          <Link to="/register" className="text-blue-600">
            {" "}
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
