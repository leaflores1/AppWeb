import { useFotos } from "../../context/fotosContext";
import { Button, ButtonLink, Card } from "../ui";

export function FotoCard({ foto }) {
  const { deleteFoto } = useFotos();

  return (
    <Card>
      <header className="flex justify-between">
        <h1 className="text-2xl font-bold">{foto.title}</h1>
        <div className="flex gap-x-2 items-center">
          <Button onClick={() => deleteFoto(foto._id)}>Delete</Button>
          <ButtonLink to={`/fotos/${foto._id}`}>Edit</ButtonLink>
        </div>
      </header>
      <p className="text-slate-300">{foto.description}</p>
      {/* format date */}
      <p>
        {foto.date &&
          new Date(foto.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
      </p>
    </Card>
  );
}
