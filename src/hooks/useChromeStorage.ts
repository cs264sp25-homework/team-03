import { useChromeStorageLocal } from "use-chrome-storage";
import { SessionId } from "convex-helpers/server/sessions";

//custom wrapper for use-chrome-storage
//https://www.npmjs.com/package/use-chrome-storage

//TODO: file not used, this is not working with the session provider, need to fix
export function chromeStorageSessionProvider(key: string): readonly [
  SessionId | undefined,
  (value: SessionId | undefined) => void
] {
  const [rawValue, setRawValue] = useChromeStorageLocal<string | undefined>(key);

  const castedValue = rawValue as SessionId | undefined;
  const castedSetter = setRawValue as (value: SessionId | undefined) => void;

  return [castedValue, castedSetter];
}
