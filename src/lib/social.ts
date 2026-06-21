import { db } from "@/lib/db";

export type FeedPost = {
  id: string;
  content: string;
  image: string | null;
  category: string;
  createdAt: string;
  author: { id: string; name: string; role: string; image: string | null };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string; role: string; image: string | null };
  }[];
};

export async function getFeed(currentUserId: string): Promise<FeedPost[]> {
  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: currentUserId }, select: { id: true } },
    },
  });

  return posts.map((p) => ({
    id: p.id,
    content: p.content,
    image: p.image,
    category: p.category,
    createdAt: p.createdAt.toISOString(),
    author: { id: p.author.id, name: p.author.name, role: p.author.role, image: p.author.image },
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    likedByMe: p.likes.length > 0,
    comments: p.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: { name: c.author.name, role: c.author.role, image: c.author.image },
    })),
  }));
}
