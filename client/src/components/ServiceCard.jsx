import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Stars from "./Stars";
import { formatTaka } from "../utils/format";

export default function ServiceCard({ service }) {
  const provider = service.provider;
  return (
    <Link to={`/services/${service.id}`} className="group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader>
          <Badge variant="secondary">{service.category.name}</Badge>
          <CardTitle className="text-lg">{service.title}</CardTitle>
          <CardDescription>
            {provider.user.name} · {service.area}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex items-center justify-between gap-2">
          <Stars value={provider.ratingAvg} count={provider.ratingCount} />
          <p className="font-semibold">
            {formatTaka(service.price)}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {service.durationMin} min
            </span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
