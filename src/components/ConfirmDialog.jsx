export default function ConfirmDialog({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
                <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Confirmation</p>
                    <h3 className="mt-2 text-xl font-black text-stone-900">{title}</h3>
                </div>

                <p className="text-sm leading-6 text-stone-600">{message}</p>

                <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
