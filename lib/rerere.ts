import { createHash as Silian_createHash } from "node:crypto"

import { prisma as Silian_prisma } from "@/lib/prisma"

export interface ConflictBlock {
  id: string
  filePath: string
  base: string
  ours: string
  theirs: string
  autoApplied?: { resolution: string; source: "rerere" }
}

export const SIMPLE_CONFLICT_BLOCK_RE =
  /<<<<<<< draft\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> main\n?/g

export function formatConflictMarker(Silian_ours: string, Silian_theirs: string): string {
  return `<<<<<<< draft\n${Silian_ours}=======\n${Silian_theirs}>>>>>>> main\n`
}

export function parseConflictBlocks(
  Silian_content: string,
  Silian_filePath: string,
  Silian_baseContent: string
): ConflictBlock[] {
  const Silian_blocks: ConflictBlock[] = []
  const Silian_regex = new RegExp(SIMPLE_CONFLICT_BLOCK_RE.source, "g")
  let Silian_match: RegExpExecArray | null
  let Silian_i = 0

  Silian_match = Silian_regex.exec(Silian_content)
  while (Silian_match !== null) {
    Silian_blocks.push({
      id: `conflict-${Silian_i++}`,
      filePath: Silian_filePath,
      base: Silian_baseContent,
      ours: Silian_match[1],
      theirs: Silian_match[2],
    })
    Silian_match = Silian_regex.exec(Silian_content)
  }

  return Silian_blocks
}

export function applyAutoAppliedResolutions(
  Silian_content: string,
  Silian_appliedBlocks: ConflictBlock[]
): string {
  if (Silian_appliedBlocks.length === 0) {
    return Silian_content
  }

  const Silian_appliedById = new Map(Silian_appliedBlocks.map((Silian_block) => [Silian_block.id, Silian_block]))
  const Silian_regex = new RegExp(SIMPLE_CONFLICT_BLOCK_RE.source, "g")
  let Silian_index = 0

  return Silian_content.replace(Silian_regex, (Silian_fullMatch) => {
    const Silian_block = Silian_appliedById.get(`conflict-${Silian_index++}`)

    if (!Silian_block?.autoApplied) {
      return Silian_fullMatch
    }

    return Silian_block.autoApplied.resolution
  })
}

function Silian_normalizeInput(Silian_input: string): string {
  return Silian_input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd()
}

export function computeConflictHash(
  Silian_filePath: string,
  Silian_base: string,
  Silian_ours: string,
  Silian_theirs: string
): string {
  const Silian_normalizedPayload = JSON.stringify({
    filePath: Silian_normalizeInput(Silian_filePath),
    base: Silian_normalizeInput(Silian_base),
    ours: Silian_normalizeInput(Silian_ours),
    theirs: Silian_normalizeInput(Silian_theirs),
  })

  return Silian_createHash("sha256").update(Silian_normalizedPayload).digest("hex")
}

export async function lookupRerere(
  Silian_conflictHash: string
): Promise<string | null> {
  const Silian_record = await Silian_prisma.conflictResolution.findUnique({
    where: { conflictHash: Silian_conflictHash },
    select: { resolution: true },
  })

  return Silian_record?.resolution ?? null
}

export async function storeRerere(
  Silian_filePath: string,
  Silian_base: string,
  Silian_ours: string,
  Silian_theirs: string,
  Silian_resolution: string
): Promise<void> {
  const Silian_conflictHash = computeConflictHash(Silian_filePath, Silian_base, Silian_ours, Silian_theirs)

  await Silian_prisma.conflictResolution.upsert({
    where: { conflictHash: Silian_conflictHash },
    create: {
      conflictHash: Silian_conflictHash,
      filePath: Silian_filePath,
      resolution: Silian_resolution,
    },
    update: {
      filePath: Silian_filePath,
      resolution: Silian_resolution,
    },
  })
}

export async function autoApplyRerere(Silian_blocks: ConflictBlock[]): Promise<{
  applied: ConflictBlock[]
  remaining: ConflictBlock[]
}> {
  const Silian_resolutions = await Promise.all(
    Silian_blocks.map(async (Silian_block) => ({
      block: Silian_block,
      resolution: await lookupRerere(
        computeConflictHash(
          Silian_block.filePath,
          Silian_block.base,
          Silian_block.ours,
          Silian_block.theirs
        )
      ),
    }))
  )

  const Silian_applied: ConflictBlock[] = []
  const Silian_remaining: ConflictBlock[] = []

  for (const { block: Silian_block, resolution: Silian_resolution } of Silian_resolutions) {
    if (Silian_resolution !== null) {
      Silian_applied.push({
        ...Silian_block,
        autoApplied: {
          resolution: Silian_resolution,
          source: "rerere",
        },
      })
      continue
    }

    Silian_remaining.push(Silian_block)
  }

  return { applied: Silian_applied, remaining: Silian_remaining }
}
