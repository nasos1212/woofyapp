export function ownsCommunityQuestion(authorId: string | null, viewerId?: string): boolean {
  return Boolean(viewerId && authorId === viewerId);
}