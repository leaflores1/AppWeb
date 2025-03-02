import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UsersSlider from "../components/UsersSlider";

function HomePage() {

  return (
    <>
      {showAgeModal && 
      <AgeVerificationModal
      className="text-black" 
      onConfirm={handleAgeVerification} />}
      <div className="flex flex-col min-h-screen">
        <section className="bg-black flex flex-col md:flex-row items-center justify-center flex-grow rounded-lg">
          {/* Imagen a la izquierda */}
          <div className="w-full md:w-1/2 flex justify-center p-4 mt-8">
            <img
              src="/Instagram-Portada.jpg"
              alt="Instagram Portada"
              className="w-full h-auto max-w-md rounded-full md:max-w-xl object-cover"
            />
          </div>
          {/* Texto a la derecha */}
          <header className="text-center text-white md:w-1/2 p-4 flex flex-col justify-center items-center">
            <h1 className="text-4xl pb-4 font-bold text-center">
              Titulo
            </h1>
            <p className="text-lg text-slate-300 mb-6 max-w-3xl text-center">
              Descripcion de la web
            </p>
            <div className="mt-4">
              <Link
                className="bg-[#1f85b4] hover:bg-blue-600 text-white font-regular px-6 py-3 rounded-md transition-all text-lg"
                to="/register"
              >
                ¡Empieza ahora!
              </Link>
            </div>
          </header>
        </section>
        {/* Aquí se muestra el slider de usuarios */}
        <div className = "mt-6" >
          <UsersSlider /></div>
         
         
        {/* Footer */}
        <footer className="text-white text-center py-20">
          <p className="mb-1">© 2025 Instagram. Todos los derechos reservados.</p>
          <div className="flex justify-center space-x-4">
            <Link to="/terms" className="text-sky-400 hover:underline">
              Términos y Condiciones
            </Link>
            <Link to="/privacy_policies" className="text-sky-400 hover:underline">
              Política de Privacidad
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

export default HomePage;
