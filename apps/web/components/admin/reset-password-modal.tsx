"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { useLocale } from "@/lib/context"
import { cn } from "@/lib/utils"

interface ResetPasswordModalProps {
  open: boolean
  username: string
  saving: boolean
  onClose: () => void
  onConfirm: (newPassword: string) => Promise<void> | void
}

export function ResetPasswordModal({
  open,
  username,
  saving,
  onClose,
  onConfirm,
}: ResetPasswordModalProps) {
  const { t } = useLocale()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) {
      setNewPassword("")
      setConfirmPassword("")
      setSubmitted(false)
    }
  }, [open])

  const passwordTooShort = newPassword.trim().length > 0 && newPassword.trim().length < 5
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const canSubmit = newPassword.trim().length >= 5 && newPassword === confirmPassword

  const handleSubmit = async () => {
    setSubmitted(true)
    if (!canSubmit) return
    await onConfirm(newPassword.trim())
  }

  return (
    <Modal open={open} onClose={() => !saving && onClose()} className="max-w-md">
      <div className="flex flex-col gap-5 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{t("admin.resetPassword")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.resetPasswordFor")} <span className="font-medium text-foreground">{username}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-password-input">
              {t("admin.newPassword")}
            </label>
            <input
              id="reset-password-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={cn(
                "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                submitted && passwordTooShort && "border-red-500 focus:ring-red-500/30"
              )}
              placeholder={t("admin.passwordMinLengthHint")}
              disabled={saving}
            />
            {submitted && passwordTooShort && (
              <p className="text-xs text-red-500">{t("admin.passwordMinLengthHint")}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-password-confirm-input">
              {t("admin.confirmPassword")}
            </label>
            <input
              id="reset-password-confirm-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                submitted && passwordMismatch && "border-red-500 focus:ring-red-500/30"
              )}
              placeholder={t("admin.confirmPassword")}
              disabled={saving}
            />
            {submitted && passwordMismatch && (
              <p className="text-xs text-red-500">{t("admin.passwordMismatch")}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? t("admin.saving") : t("admin.confirmResetPassword")}
          </button>
        </div>
      </div>
    </Modal>
  )
}
