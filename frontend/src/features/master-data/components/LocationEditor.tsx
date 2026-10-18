import { saveLocation, type LocationChanges } from "../api/client";
import type { Location } from "../types";
import { MasterDataEditor } from "./MasterDataEditor";

import { LocationFields } from "./LocationFields";

const defaults: LocationChanges = {
  code: "",
  kind: "picking",
  zone: "A",
  active: true,
  inboundBlocked: false,
  outboundBlocked: false,
};

export function LocationEditor({
  location,
  onCancel,
  onSaved,
}: {
  location: Location | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  return (
    <MasterDataEditor<LocationChanges>
      key={location?.id ?? "new"}
      title={location ? `แก้ไขช่อง · ${location.code}` : "เพิ่มช่องเก็บ"}
      initialValues={
        location
          ? {
              code: location.code,
              kind: location.kind,
              zone: location.zone,
              active: location.active,
              inboundBlocked: location.inboundBlocked,
              outboundBlocked: location.outboundBlocked,
              reason: "",
              labelConfirmed: false,
            }
          : defaults
      }
      onSave={(values, key) => saveLocation(values, location, key)}
      onCancel={onCancel}
      onSaved={onSaved}
    >
      <LocationFields location={location} />
    </MasterDataEditor>
  );
}
