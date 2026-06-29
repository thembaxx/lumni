import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import CalculatorIcon from "@hugeicons/core-free-icons/CalculatorIcon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import ColorsIcon from "@hugeicons/core-free-icons/ColorsIcon";
import ConstructionIcon from "@hugeicons/core-free-icons/ConstructionIcon";
import DnaIcon from "@hugeicons/core-free-icons/DnaIcon";
import EcoEnergyIcon from "@hugeicons/core-free-icons/EcoEnergyIcon";
import FavouriteIcon from "@hugeicons/core-free-icons/FavouriteIcon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import LandmarkIcon from "@hugeicons/core-free-icons/LandmarkIcon";
import LaptopIcon from "@hugeicons/core-free-icons/LaptopIcon";
import MapPinIcon from "@hugeicons/core-free-icons/MapPinIcon";
import MapsIcon from "@hugeicons/core-free-icons/MapsIcon";
import MusicNote01Icon from "@hugeicons/core-free-icons/MusicNote01Icon";
import PenTool01Icon from "@hugeicons/core-free-icons/PenTool01Icon";
import PhysicsIcon from "@hugeicons/core-free-icons/PhysicsIcon";
import ReceiptTextIcon from "@hugeicons/core-free-icons/ReceiptTextIcon";
import Restaurant01Icon from "@hugeicons/core-free-icons/Restaurant01Icon";
import ShoppingCart01Icon from "@hugeicons/core-free-icons/ShoppingCart01Icon";
import ToolsIcon from "@hugeicons/core-free-icons/ToolsIcon";
import WorkIcon from "@hugeicons/core-free-icons/WorkIcon";

const iconMap: Record<string, typeof BookOpen01Icon> = {
  book: BookOpen01Icon,
  "book-open": BookOpen01Icon,
  calculator: CalculatorIcon,
  atom: PhysicsIcon,
  dna: DnaIcon,
  plant: EcoEnergyIcon,
  receipt: ReceiptTextIcon,
  briefcase: WorkIcon,
  "chart-line": ChartUpIcon,
  globe: GlobeIcon,
  "ancient-pyramids": LandmarkIcon,
  heart: FavouriteIcon,
  laptop: LaptopIcon,
  monitor: LaptopIcon,
  "pen-tool": PenTool01Icon,
  hammer: ConstructionIcon,
  zap: FlashIcon,
  wrench: ToolsIcon,
  palette: ColorsIcon,
  "theater-masks": MapPinIcon,
  music: MusicNote01Icon,
  "shopping-cart": ShoppingCart01Icon,
  map: MapsIcon,
  utensils: Restaurant01Icon,
  tractor: EcoEnergyIcon,
};

export function getSubjectIcon(iconName: string): typeof BookOpen01Icon {
  return iconMap[iconName] || BookOpen01Icon;
}

export { iconMap };
