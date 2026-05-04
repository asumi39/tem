import type { PrismaClient } from "@prisma/client";

import { rubricSchema, type RubricInput } from "./rubric.schemas";

export function validateRubric(input: unknown): RubricInput {
  return rubricSchema.parse(input);
}

export async function createRubric(prisma: PrismaClient, input: unknown) {
  const data = validateRubric(input);

  return prisma.scoringRubric.create({ data });
}

export async function upsertRubricByTitle(prisma: PrismaClient, input: unknown) {
  const data = validateRubric(input);

  return prisma.scoringRubric.upsert({
    where: { title: data.title },
    update: data,
    create: data
  });
}
