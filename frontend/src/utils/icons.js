import {
  createIcons,
  Search,
  CircleUserRound,
  Heart,
  Star,
  Compass,
  Landmark,
  Leaf,
  Trees,
  Utensils,
  UtensilsCrossed,
  Church,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Clock,
  LayoutGrid,
  ExternalLink,
  MapPinCheck,
  LocateFixed,
  Trophy,
  Gift,
  Map,
  Globe
} from "lucide";

// Todo icono referenciado en el HTML vía data-lucide="..." debe estar aquí.
// Si falta, Lucide simplemente no reemplaza el <i> y el icono no se ve,
// sin ningún error visible en consola — por eso conviene mantener esta
// lista sincronizada con los data-lucide usados en el proyecto.
export const loadIcons = () => {
  createIcons({
    icons: {
      Search,
      CircleUserRound,
      Heart,
      Star,
      Compass,
      Landmark,
      Leaf,
      Trees,
      Utensils,
      UtensilsCrossed,
      Church,
      ShoppingBag,
      ChevronLeft,
      ChevronRight,
      ArrowLeft,
      MapPin,
      Clock,
      LayoutGrid,
      ExternalLink,
      MapPinCheck,
      LocateFixed,
      Trophy,
      Gift,
      Map,
      Globe
    },
  });
};
