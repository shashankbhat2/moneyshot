// The latest screenshot and uploaded background images, in IndexedDB.
import { createStore, del, get, set } from "idb-keyval";

const store = () => createStore("moneyshot", "screenshots");
const LATEST = "latest";

export const putShot = (blob: Blob) => set(LATEST, blob, store());
export const getShot = () => get<Blob>(LATEST, store());

/** Uploaded background images, by id. */
const assetKey = (id: string) => `asset:${id}`;
export const putAsset = (id: string, blob: Blob) => set(assetKey(id), blob, store());
export const getAsset = (id: string) => get<Blob>(assetKey(id), store());
export const deleteAsset = (id: string) => del(assetKey(id), store());
