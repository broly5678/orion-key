"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useLocale } from "@/lib/context"
import { adminCurrencyApi, withMockFallback } from "@/services/api"
import { Modal } from "@/components/ui/modal"
import type { CurrencyItem } from "@/types"

const DEFAULT_CURRENCIES: CurrencyItem[] = [
  { code: "CNY", name: "人民币", symbol: "¥", rate_to_cny: 1, is_enabled: true, sort_order: 1 },
  { code: "USD", name: "美元", symbol: "$", rate_to_cny: 7.2, is_enabled: true, sort_order: 2 },
  { code: "EUR", name: "欧元", symbol: "€", rate_to_cny: 7.8, is_enabled: true, sort_order: 3 },
  { code: "JPY", name: "日元", symbol: "¥", rate_to_cny: 0.05, is_enabled: true, sort_order: 4 },
  { code: "KRW", name: "韩元", symbol: "₩", rate_to_cny: 0.0052, is_enabled: true, sort_order: 5 },
  { code: "GBP", name: "英镑", symbol: "£", rate_to_cny: 9.1, is_enabled: true, sort_order: 6 },
  { code: "USDT", name: "USDT", symbol: "₮", rate_to_cny: 7.2, is_enabled: true, sort_order: 7 },
]

const EMPTY_FORM = {
  code: "",
  name: "",
  symbol: "",
  rate_to_cny: "1",
  is_enabled: true,
  sort_order: "0",
}

export default function AdminCurrenciesPage() {
  const { t } = useLocale()
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CurrencyItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const sortedCurrencies = useMemo(
    () => [...currencies].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [currencies]
  )

  async function fetchCurrencies() {
    setLoading(true)
    try {
      const data = await withMockFallback(() => adminCurrencyApi.getList(), () => DEFAULT_CURRENCIES)
      setCurrencies(data)
    } catch {
      setCurrencies(DEFAULT_CURRENCIES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrencies()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(currency: CurrencyItem) {
    setEditing(currency)
    setForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      rate_to_cny: String(currency.rate_to_cny ?? 1),
      is_enabled: currency.is_enabled ?? true,
      sort_order: String(currency.sort_order ?? 0),
    })
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function saveCurrency() {
    if (!form.code.trim() || !form.name.trim() || !form.symbol.trim()) {
      toast.error("请完整填写货币代码、名称和符号")
      return
    }
    const rate = Number(form.rate_to_cny)
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error("汇率必须大于 0")
      return
    }
    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        rate_to_cny: rate,
        is_enabled: form.is_enabled,
        sort_order: Number(form.sort_order) || 0,
      }
      if (editing?.id) {
        await adminCurrencyApi.update(editing.id, payload)
      } else {
        await adminCurrencyApi.create(payload)
      }
      toast.success("汇率已保存")
      closeModal()
      await fetchCurrencies()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  async function removeCurrency(currency: CurrencyItem) {
    if (!currency.id) return
    try {
      await adminCurrencyApi.delete(currency.id)
      toast.success("货币已删除")
      await fetchCurrencies()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">汇率配置</h1>
          <p className="text-sm text-muted-foreground">这里配置 1 单位外币对应多少人民币，前端显示换算和真实下单结算都会读这里。</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          新增货币
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">代码</th>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">符号</th>
              <th className="px-4 py-3">1 单位兑 CNY</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">排序</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedCurrencies.map((currency) => (
              <tr key={currency.id || currency.code} className="border-t border-border">
                <td className="px-4 py-3 font-semibold text-foreground">{currency.code}</td>
                <td className="px-4 py-3 text-foreground">{currency.name}</td>
                <td className="px-4 py-3 text-foreground">{currency.symbol}</td>
                <td className="px-4 py-3 text-foreground">{currency.rate_to_cny}</td>
                <td className="px-4 py-3">
                  <span className={currency.is_enabled ? "text-emerald-600" : "text-muted-foreground"}>
                    {currency.is_enabled ? "启用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{currency.sort_order ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEdit(currency)} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {currency.id && (
                      <button type="button" onClick={() => removeCurrency(currency)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={closeModal} className="max-w-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{editing ? "编辑货币" : "新增货币"}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">货币代码</label>
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="例如 USD" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">名称</label>
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="例如 美元" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">符号</label>
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.symbol} onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))} placeholder="例如 $" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">汇率</label>
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.rate_to_cny} onChange={(e) => setForm((prev) => ({ ...prev, rate_to_cny: e.target.value }))} placeholder="例如 7.2" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">排序</label>
            <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={form.sort_order} onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))} placeholder="例如 10" />
          </div>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm((prev) => ({ ...prev, is_enabled: e.target.checked }))} />
              启用
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={closeModal} className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground">
            <X className="h-4 w-4" />
            取消
          </button>
          <button type="button" onClick={saveCurrency} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? "保存中" : "保存"}
          </button>
        </div>
      </Modal>
    </div>
  )
}
