export type ChatMessage = {
  senderUserId: string;
};

/** Member messages awaiting a staff reply (counted from the end). */
export function countPendingForStaff(
  messages: ChatMessage[],
  memberUserId: string,
): number {
  let count = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderUserId === memberUserId) count++;
    else break;
  }
  return count;
}

/** Concierge replies the member has not yet responded to. */
export function countPendingForMember(
  messages: ChatMessage[],
  memberUserId: string,
): number {
  let count = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderUserId !== memberUserId) count++;
    else break;
  }
  return count;
}
