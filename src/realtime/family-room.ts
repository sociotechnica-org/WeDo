export type FamilyRoomKey = `family:${string}`;

export function getFamilyRoomKey(familyId: string): FamilyRoomKey {
  return `family:${familyId}`;
}
