import { useMemo, useState, type ReactNode } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { ChevronRight, Pencil, Plus, Power, Sparkles, Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Modal } from '@/core/components/Modal';
import { Skeleton } from '@/core/components/Skeleton';
import { toastService } from '@/core/services/toast-service';
import { applyServerErrors, resolveServerErrorMessage, FormInput } from '@/shared/form';
import {
  generateLocationsFormSchema,
  GENERATE_LOCATION_LIMITS,
  storageLocationFormSchema,
  type GenerateLocationsFormValues,
  type StorageLocationFormValues,
} from '@/shared/validation/storage-location';
import {
  useCreateStorageLocation,
  useDeleteStorageLocation,
  useGenerateStorageLocations,
  useStorageLocations,
  useUpdateStorageLocation,
  type StorageLocation,
  type StorageLocationType,
} from '../hooks/useStorageLocations';

const NEXT_TYPE: Record<StorageLocationType, StorageLocationType | null> = {
  AISLE: 'SHELF',
  SHELF: 'LEVEL',
  LEVEL: 'BIN',
  BIN: null,
};

const TYPE_CLASS: Record<StorageLocationType, string> = {
  AISLE: 'bg-accent-alpha text-accent',
  SHELF: 'bg-info/10 text-info',
  LEVEL: 'bg-warning/10 text-warning',
  BIN: 'bg-success/10 text-success',
};

interface TreeNode extends StorageLocation {
  children: TreeNode[];
}

type ModalState =
  | { mode: 'create'; parent: StorageLocation | null }
  | { mode: 'edit'; location: StorageLocation }
  | null;

function errorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (typeof response === 'string' && response) return response;
  if (Array.isArray(response) && typeof response[0] === 'string') return response[0];
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function buildTree(locations: StorageLocation[]): TreeNode[] {
  const byParent = new Map<string | null, StorageLocation[]>();
  for (const location of locations) {
    const siblings = byParent.get(location.parentId) ?? [];
    siblings.push(location);
    byParent.set(location.parentId, siblings);
  }
  const build = (parentId: string | null): TreeNode[] =>
    (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      .map((location) => ({ ...location, children: build(location.id) }));
  return build(null);
}

export function StorageLocationTree({ warehouseId, warehouseActive = true }: { warehouseId: string; warehouseActive?: boolean }) {
  const { t, locale } = useTranslation();
  const { data: locations = [], isLoading, isError, refetch, isFetching } = useStorageLocations(warehouseId);
  const updateLocation = useUpdateStorageLocation(warehouseId);
  const deleteLocation = useDeleteStorageLocation(warehouseId);
  const [modal, setModal] = useState<ModalState>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StorageLocation | null>(null);
  const [actionError, setActionError] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildTree(locations), [locations]);

  const toggleCollapsed = (id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = (parent: StorageLocation | null) => {
    if (parent) {
      setCollapsed((current) => {
        if (!current.has(parent.id)) return current;
        const next = new Set(current);
        next.delete(parent.id);
        return next;
      });
    }
    setModal({ mode: 'create', parent });
  };

  const toggleActive = async (location: StorageLocation) => {
    setActionError('');
    try {
      await updateLocation.mutateAsync({ id: location.id, data: { isActive: !location.isActive } });
    } catch (error) {
      setActionError(errorMessage(error, t('common.saveUnconfirmed')));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    try {
      await deleteLocation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toastService.success(t('inventory.warehouseView.locationDeleted'));
    } catch (error) {
      setDeleteTarget(null);
      setActionError(errorMessage(error, t('common.saveUnconfirmed')));
    }
  };

  const mutating = updateLocation.isPending || deleteLocation.isPending;
  const renderNode = (node: TreeNode, depth: number, ancestorsActive = warehouseActive): ReactNode => {
    const nextType = NEXT_TYPE[node.type];
    const activeDescendants = (location: TreeNode): boolean => location.children.some((child) => child.isActive || activeDescendants(child));
    const toggleBlocked = mutating || (!node.isActive && !ancestorsActive) || (node.isActive && activeDescendants(node));
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);
    return (
      <li key={node.id}>
        <div
          className="group flex items-center gap-2 rounded-lg py-1.5 pr-2 hover:bg-surface-hover"
          style={{ paddingLeft: 8 + depth * 18 }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCollapsed(node.id)}
              aria-label={`${isCollapsed ? t('inventory.warehouseView.expand') : t('inventory.warehouseView.collapse')} ${node.path}`}
              aria-expanded={!isCollapsed}
              aria-controls={`location-children-${node.id}`}
              title={`${isCollapsed ? t('inventory.warehouseView.expand') : t('inventory.warehouseView.collapse')} ${node.path}`}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted hover:bg-surface-active hover:text-text-primary"
            >
              <ChevronRight
                size={13}
                aria-hidden="true"
                className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              />
            </button>
          ) : (
            <span className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_CLASS[node.type]}`}>
            {t(`inventory.warehouseView.type${node.type}`)}
          </span>
          <span className="shrink-0 font-mono text-xs text-text-primary">{node.code}</span>
          {node.name && <span className="truncate text-xs text-text-secondary">{node.name}</span>}
          <span className="ml-auto flex shrink-0 items-center gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${node.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
            >
              {node.isActive ? t('inventory.warehouseView.active') : t('inventory.warehouseView.inactive')}
            </span>
            <span className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
              {nextType && (
                <button
                  type="button"
                  onClick={() => openCreate(node)}
                  disabled={!ancestorsActive || !node.isActive || mutating || isError}
                  aria-label={t('inventory.warehouseView.addChild')}
                  title={t('inventory.warehouseView.addChild')}
                  className="rounded-md p-1 text-text-secondary hover:bg-surface-active hover:text-accent"
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setModal({ mode: 'edit', location: node })}
                aria-label={t('common.edit')}
                title={t('common.edit')}
                className="rounded-md p-1 text-text-secondary hover:bg-surface-active hover:text-text-primary"
              >
                <Pencil size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void toggleActive(node)}
                disabled={toggleBlocked || isError}
                aria-busy={updateLocation.isPending && updateLocation.variables?.id === node.id}
                aria-label={
                  node.isActive ? t('inventory.warehouseView.deactivate') : t('inventory.warehouseView.reactivate')
                }
                title={
                  node.isActive ? t('inventory.warehouseView.deactivate') : t('inventory.warehouseView.reactivate')
                }
                className="rounded-md p-1 text-text-secondary hover:bg-surface-active hover:text-warning"
              >
                <Power size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(node)}
                disabled={hasChildren || mutating || isError}
                aria-label={t('inventory.warehouseView.deleteLocation')}
                title={t('inventory.warehouseView.deleteLocation')}
                className="rounded-md p-1 text-text-secondary hover:bg-error/10 hover:text-error"
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </span>
          </span>
        </div>
        {hasChildren && (
          <ul id={`location-children-${node.id}`} hidden={isCollapsed}>
            {node.children.map((child) => renderNode(child, depth + 1, ancestorsActive && node.isActive))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {t('inventory.warehouseView.locationsTitle')}
          </h3>
          <p className="text-xs text-text-secondary">
            {t('inventory.warehouseView.locationsHint')}. {locale === 'en' ? 'Location directory only. Stock is recorded per warehouse, not per bin.' : 'Solo directorio de ubicaciones. El stock se registra por almacén, no por bin.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setGenerateOpen(true)}
            disabled={!warehouseActive || isLoading || isError || mutating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
          >
            <Sparkles size={14} aria-hidden="true" />
            {t('inventory.warehouseView.generate')}
          </button>
          <button
            type="button"
            onClick={() => openCreate(null)}
            disabled={!warehouseActive || isLoading || isError || mutating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            <Plus size={14} aria-hidden="true" />
            {t('inventory.warehouseView.addAisle')}
          </button>
        </div>
      </div>

      {isError && <div role="alert" className="text-sm text-error">
        {locale === 'en' ? 'Could not load the location directory.' : 'No se pudo cargar el directorio de ubicaciones.'}
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className="ml-3 font-semibold text-accent disabled:opacity-50">{isFetching ? t('common.loading') : t('common.retry')}</button>
      </div>}
      {!warehouseActive && <p className="text-xs text-text-secondary">{locale === 'en' ? 'Activate the warehouse and its branch before creating or reactivating locations.' : 'Activa el almacén y su sucursal antes de crear o reactivar ubicaciones.'}</p>}
      {isFetching && locations.length > 0 && <p role="status" className="text-xs text-text-secondary">{t('common.loading')}</p>}
      {actionError && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {actionError}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface p-3">
        {isLoading ? (
          <div role="status" aria-busy="true" className="grid gap-2">
            <span className="sr-only">{t('common.loading')}</span>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rect" height={28} />
            ))}
          </div>
        ) : isError && locations.length === 0 ? null : tree.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">
            {t('inventory.warehouseView.noLocations')}
          </p>
        ) : (
          <ul className="grid gap-0.5">{tree.map((node) => renderNode(node, 0))}</ul>
        )}
      </div>

      {modal && (
        <LocationFormModal
          key={modal.mode === 'edit' ? modal.location.id : `create-${modal.parent?.id ?? 'root'}`}
          warehouseId={warehouseId}
          state={modal}
          onClose={() => setModal(null)}
        />
      )}

      {generateOpen && (
        <GenerateLocationsModal warehouseId={warehouseId} onClose={() => setGenerateOpen(false)} />
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('inventory.warehouseView.deleteLocationTitle')}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {t('inventory.warehouseView.deleteLocationConfirm').replace('{path}', deleteTarget?.path ?? '')}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleteLocation.isPending}
            className="rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('inventory.warehouseView.deleteLocation')}
          </button>
        </div>
      </Modal>
    </section>
  );
}

function LocationFormModal({
  warehouseId,
  state,
  onClose,
}: {
  warehouseId: string;
  state: Exclude<ModalState, null>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const createLocation = useCreateStorageLocation(warehouseId);
  const updateLocation = useUpdateStorageLocation(warehouseId);
  const [serverError, setServerError] = useState('');
  const editing = state.mode === 'edit' ? state.location : null;
  const parent = state.mode === 'create' ? state.parent : null;
  const type: StorageLocationType = editing
    ? editing.type
    : parent
      ? (NEXT_TYPE[parent.type] as StorageLocationType)
      : 'AISLE';

  const form = useForm({
    defaultValues: {
      parentId: editing?.parentId ?? parent?.id ?? '',
      type,
      name: editing?.name ?? '',
    } satisfies StorageLocationFormValues,
    validators: { onSubmit: storageLocationFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        if (editing) {
          await updateLocation.mutateAsync({
            id: editing.id,
            data: { name: value.name.trim() || null },
          });
        } else {
          await createLocation.mutateAsync({
            parentId: parent?.id ?? null,
            type,
            name: value.name.trim() || undefined,
          });
        }
        onClose();
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const isPending = createLocation.isPending || updateLocation.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? t('inventory.warehouseView.editLocation') : t('inventory.warehouseView.addLocation')}
      size="sm"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="grid gap-3"
      >
        <div className="rounded-lg bg-surface-hover px-3 py-2 text-xs text-text-secondary">
          <div className="flex items-center justify-between gap-2">
            <span>{t('inventory.warehouseView.type')}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_CLASS[type]}`}>
              {t(`inventory.warehouseView.type${type}`)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span>{t('inventory.warehouseView.parent')}</span>
            <span className="font-mono text-text-primary">{parent?.path || editing?.path.split('/').slice(0, -1).join('/') || t('inventory.warehouseView.noParent')}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span>{t('inventory.warehouseView.code')}</span>
            <span className="font-mono text-text-primary">
              {editing?.code ?? t('inventory.warehouseView.autoCode')}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-text-secondary">
          {editing
            ? t('inventory.warehouseView.codeImmutable')
            : t('inventory.warehouseView.autoCodeHint')}
        </p>
        <FormInput
          form={form}
          name="name"
          label={t('inventory.warehouseView.locationName')}
          placeholder={t('inventory.warehouseView.locationNamePlaceholder')}
          ariaLabel={t('inventory.warehouseView.locationName')}
        />
        {serverError && (
          <p role="alert" className="text-sm text-error">
            {serverError}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GenerateLocationsModal({ warehouseId, onClose }: { warehouseId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const generate = useGenerateStorageLocations(warehouseId);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: {
      aisles: 1,
      shelves: 1,
      levels: 1,
      bins: 1,
    } satisfies GenerateLocationsFormValues,
    validators: { onSubmit: generateLocationsFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        const result = await generate.mutateAsync({
          aisles: value.aisles,
          shelves: value.shelves,
          levels: value.levels,
          bins: value.bins,
        });
        toastService.success(
          t('inventory.warehouseView.generateSuccess').replace('{count}', String(result?.created ?? 0)),
        );
        onClose();
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const planned = [values.aisles, values.shelves, values.levels, values.bins].every(
    (count) => typeof count === 'number' && Number.isFinite(count),
  )
    ? values.aisles * (1 + values.shelves * (1 + values.levels * (1 + values.bins)))
    : 0;

  return (
    <Modal open onClose={onClose} title={t('inventory.warehouseView.generateTitle')} size="md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="grid gap-3"
      >
        <p className="text-xs text-text-secondary">{t('inventory.warehouseView.generateHint')}</p>
        <p className="text-xs text-text-secondary">{t('inventory.warehouseView.generateScheme')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput
            form={form}
            name="aisles"
            type="number"
            min={1}
            max={GENERATE_LOCATION_LIMITS.aisles}
            step={1}
            label={t('inventory.warehouseView.aisles')}
            ariaLabel={t('inventory.warehouseView.aisles')}
          />
          <FormInput
            form={form}
            name="shelves"
            type="number"
            min={1}
            max={GENERATE_LOCATION_LIMITS.shelves}
            step={1}
            label={t('inventory.warehouseView.shelvesPerAisle')}
            ariaLabel={t('inventory.warehouseView.shelvesPerAisle')}
          />
          <FormInput
            form={form}
            name="levels"
            type="number"
            min={1}
            max={GENERATE_LOCATION_LIMITS.levels}
            step={1}
            label={t('inventory.warehouseView.levelsPerShelf')}
            ariaLabel={t('inventory.warehouseView.levelsPerShelf')}
          />
          <FormInput
            form={form}
            name="bins"
            type="number"
            min={1}
            max={GENERATE_LOCATION_LIMITS.bins}
            step={1}
            label={t('inventory.warehouseView.binsPerLevel')}
            ariaLabel={t('inventory.warehouseView.binsPerLevel')}
          />
        </div>
        <p className="rounded-lg bg-surface-hover px-3 py-2 text-xs text-text-secondary">
          {t('inventory.warehouseView.generatePreview').replace('{count}', String(planned))}
        </p>
        {serverError && (
          <p role="alert" className="text-sm text-error">
            {serverError}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={generate.isPending}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('inventory.warehouseView.generate')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
