import { describe, expect, it } from 'vitest'
import i18n from '@/i18n/index'

describe('i18n', () => {
  it('expose fr and en locales', async () => {
    await i18n.changeLanguage('fr')
    expect(i18n.t('nav.settings')).toBe('Paramètres')
    expect(i18n.t('rules.MERISE-E001.title')).toBe('Entité sans nom')

    await i18n.changeLanguage('en')
    expect(i18n.t('nav.settings')).toBe('Settings')
    expect(i18n.t('rules.MERISE-E001.title')).toBe('Unnamed entity')
    expect(i18n.t('templates.blog.label')).toBe('Blog')
  })

  it('pluralise les compteurs', async () => {
    await i18n.changeLanguage('fr')
    expect(i18n.t('common.entity', { count: 1 })).toBe('1 entité')
    expect(i18n.t('common.entity', { count: 3 })).toBe('3 entités')
  })
})
