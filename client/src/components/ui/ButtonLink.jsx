import { Link } from "react-router-dom";

export const ButtonLink = ({ to, children }) => (
  <Link to={to} className="bg-black
   hover:bg-[#29b7f8]
   px-4 py-2 mx-6 
   rounded-md font-light
   transition-all
   whitespace-nowrap
   text-[12px]
   -mr-8 
   ">
    {children}
  </Link>
);
