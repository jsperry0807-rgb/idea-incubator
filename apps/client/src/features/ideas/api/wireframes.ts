import { client } from "@/axios";
import type { Wireframe } from "@repo/shared";

export async function listWireframes(ideaId: string): Promise<string[]> {
  const { data } = await client.get<{ data: { filename: string }[] }>(
    `/ideas/${ideaId}/wireframes`,
  );
  return data.data.map((item) => item.filename);
}

export async function uploadWireframe(
  ideaId: string,
  name: string,
  html: string,
): Promise<{ filename: string }> {
  const { data } = await client.post<{ data: { filename: string } }>(
    `/ideas/${ideaId}/wireframes`,
    { name, html },
  );
  return data.data;
}

export async function getWireframe(ideaId: string, name: string): Promise<Wireframe> {
  const { data } = await client.get<{ data: Wireframe }>(
    `/ideas/${ideaId}/wireframes/${name}`,
  );
  return data.data;
}

export async function deleteWireframe(ideaId: string, name: string): Promise<void> {
  await client.delete(`/ideas/${ideaId}/wireframes/${name}`);
}
