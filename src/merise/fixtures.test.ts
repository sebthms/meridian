import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Project } from '@/domain'
import { validateProject } from './validator'
import { generateMld } from '@/mld'
import { generateSql } from '@/sql'

function loadFixture(name: string): Project {
  const raw = readFileSync(resolve(import.meta.dirname, '../../fixtures', name), 'utf-8')
  return JSON.parse(raw) as Project
}

describe('reference fixtures', () => {
  it('simple-entity validates and generates MLD + SQL', () => {
    const project = loadFixture('simple-entity.json')
    const { errors } = validateProject(project)
    expect(errors).toHaveLength(0)

    const mld = generateMld(project)
    expect(mld.relations).toHaveLength(1)
    expect(generateSql(mld)).toContain('CREATE TABLE client')
  })

  it('one-to-many produces a FK', () => {
    const project = loadFixture('one-to-many.json')
    const mld = generateMld(project)
    const cmd = mld.relations.find((r) => r.name === 'COMMANDE')!
    expect(cmd.columns.some((c) => c.isForeignKey && c.references?.table === 'CLIENT')).toBe(true)
  })

  it('many-to-many produces an associative table', () => {
    const project = loadFixture('many-to-many.json')
    const mld = generateMld(project)
    const rel = mld.relations.find((r) => r.name === 'INSCRIPTION')!
    expect(rel.columns.every((c) => c.isPrimaryKey && c.isForeignKey)).toBe(true)
  })

  it('association-properties keeps properties on the associative table', () => {
    const project = loadFixture('association-properties.json')
    const mld = generateMld(project)
    const rel = mld.relations.find((r) => r.name === 'INSCRIPTION')!
    expect(rel.columns.some((c) => c.name === 'date')).toBe(true)
    expect(rel.columns.some((c) => c.name === 'note')).toBe(true)
  })

  it('one-to-one places FK in the 1,1 side', () => {
    const project = loadFixture('one-to-one.json')
    const mld = generateMld(project)
    const b = mld.relations.find((r) => r.name === 'B')!
    expect(b.columns.some((c) => c.isForeignKey && c.references?.table === 'A')).toBe(true)
  })

  it('reflexive produces a self-referencing FK', () => {
    const project = loadFixture('reflexive.json')
    const mld = generateMld(project)
    const employe = mld.relations.find((r) => r.name === 'EMPLOYE')!
    const fks = employe.columns.filter((c) => c.isForeignKey)
    expect(fks.length).toBeGreaterThan(0)
    expect(fks.every((c) => c.references?.table === 'EMPLOYE')).toBe(true)
  })

  it('composite-key produces a composite PK', () => {
    const project = loadFixture('composite-key.json')
    const mld = generateMld(project)
    const rel = mld.relations.find((r) => r.name === 'PALMARES')!
    expect(rel.columns.filter((c) => c.isPrimaryKey)).toHaveLength(2)
  })

  it('invalid-model surfaces blocking errors', () => {
    const project = loadFixture('invalid-model.json')
    const { errors } = validateProject(project)
    const ruleIds = new Set(errors.map((e) => e.ruleId))
    expect(ruleIds.has('MERISE-E001')).toBe(true)
    expect(ruleIds.has('MERISE-E002')).toBe(true)
    expect(ruleIds.has('MERISE-E003')).toBe(true)
    expect(ruleIds.has('MERISE-E004')).toBe(true)
  })
})
