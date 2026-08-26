/**
 * Mock Supabase client — mirrors the chained query API used in this app.
 * Operates entirely on the in-memory `store` from mockData.js.
 * No network calls, no credentials required.
 */

import { store } from './mockData.js'

class MockQueryBuilder {
  constructor(table) {
    this._table = table
    this._operation = 'select'
    this._filters = []
    this._orderField = null
    this._orderAsc = true
    this._limitN = null
    this._selectFields = '*'
    this._insertData = null
    this._updateData = null
  }

  // --- Chained methods ---

  select(fields) {
    this._selectFields = fields || '*'
    this._operation = 'select'
    return this
  }

  insert(data) {
    this._operation = 'insert'
    this._insertData = data
    return this
  }

  update(data) {
    this._operation = 'update'
    this._updateData = data
    return this
  }

  delete() {
    this._operation = 'delete'
    return this
  }

  eq(field, value) {
    this._filters.push({ type: 'eq', field, value })
    return this
  }

  is(field, value) {
    this._filters.push({ type: 'is', field, value })
    return this
  }

  ilike(field, pattern) {
    this._filters.push({ type: 'ilike', field, pattern })
    return this
  }

  gte(field, value) {
    this._filters.push({ type: 'gte', field, value })
    return this
  }

  lte(field, value) {
    this._filters.push({ type: 'lte', field, value })
    return this
  }

  order(field, opts = {}) {
    this._orderField = field
    this._orderAsc = opts.ascending !== false
    return this
  }

  limit(n) {
    this._limitN = n
    return this
  }

  // Makes the builder awaitable: `await supabase.from(...).select(...).eq(...)`
  then(onFulfilled, onRejected) {
    return Promise.resolve(this._run()).then(onFulfilled, onRejected)
  }

  // --- Execution ---

  _run() {
    const table = store[this._table]
    if (!table) {
      return { data: null, error: { message: `Mock: unknown table "${this._table}"` } }
    }

    if (this._operation === 'insert') {
      const newRow = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...this._insertData,
      }
      table.push(newRow)
      return { data: newRow, error: null }
    }

    if (this._operation === 'delete') {
      const removed = table.filter(r => this._matches(r))
      const remaining = table.filter(r => !this._matches(r))
      table.length = 0
      table.push(...remaining)
      return { data: removed, error: null }
    }

    if (this._operation === 'update') {
      for (const row of table) {
        if (this._matches(row)) {
          Object.assign(row, this._updateData)
        }
      }
      return { data: null, error: null }
    }

    // SELECT
    let rows = table.filter(r => this._matches(r))

    if (this._orderField) {
      const f = this._orderField
      const asc = this._orderAsc
      rows = [...rows].sort((a, b) => {
        if (a[f] < b[f]) return asc ? -1 : 1
        if (a[f] > b[f]) return asc ? 1 : -1
        return 0
      })
    }

    if (this._limitN !== null) rows = rows.slice(0, this._limitN)

    if (this._selectFields !== '*') {
      const fields = this._selectFields.split(',').map(s => s.trim())
      rows = rows.map(r => Object.fromEntries(fields.map(f => [f, r[f]])))
    }

    return { data: rows, error: null }
  }

  _matches(row) {
    for (const f of this._filters) {
      switch (f.type) {
        case 'eq':
          if (row[f.field] !== f.value) return false
          break
        case 'is':
          if (f.value === null) {
            if (row[f.field] !== null && row[f.field] !== undefined) return false
          } else {
            if (row[f.field] !== f.value) return false
          }
          break
        case 'gte':
          if (row[f.field] < f.value) return false
          break
        case 'lte':
          if (row[f.field] > f.value) return false
          break
        case 'ilike': {
          // Convert SQL % wildcards to regex .*
          const escaped = f.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')
          const rx = new RegExp(`^${escaped}$`, 'i')
          if (!rx.test(row[f.field] || '')) return false
          break
        }
      }
    }
    return true
  }
}

export const mockSupabase = {
  from: (table) => new MockQueryBuilder(table),
}
