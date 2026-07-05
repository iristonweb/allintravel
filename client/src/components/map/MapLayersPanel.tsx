import { Layers, MapPin, Stamp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import GlassCard from "@/components/brand/glass-card";
import { useTranslation } from "react-i18next";

export type MapLayerState = {
  myTrips: boolean;
  passportExplored: boolean;
};

type MapLayersPanelProps = {
  layers: MapLayerState;
  onChange: (layers: MapLayerState) => void;
  tripCount?: number;
  exploredCount?: number;
};

export default function MapLayersPanel({
  layers,
  onChange,
  tripCount = 0,
  exploredCount = 0,
}: MapLayersPanelProps) {
  const { t } = useTranslation();

  return (
    <GlassCard className="p-3 pointer-events-auto w-full max-w-xs border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-ait-purple" />
        <span className="text-sm font-semibold">
          {t("map.layers.title", { defaultValue: "Map layers" })}
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="layer-trips" className="flex items-center gap-2 text-sm cursor-pointer">
            <MapPin className="h-3.5 w-3.5 text-ait-orange" />
            {t("map.layers.myTrips", { defaultValue: "My trips" })}
            {tripCount > 0 && (
              <span className="text-xs text-muted-foreground">({tripCount})</span>
            )}
          </Label>
          <Switch
            id="layer-trips"
            checked={layers.myTrips}
            onCheckedChange={(myTrips) => onChange({ ...layers, myTrips })}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="layer-passport"
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Stamp className="h-3.5 w-3.5 text-ait-purple" />
            {t("map.layers.passport", { defaultValue: "Passport explored" })}
            {exploredCount > 0 && (
              <span className="text-xs text-muted-foreground">({exploredCount})</span>
            )}
          </Label>
          <Switch
            id="layer-passport"
            checked={layers.passportExplored}
            onCheckedChange={(passportExplored) => onChange({ ...layers, passportExplored })}
          />
        </div>
      </div>
    </GlassCard>
  );
}
