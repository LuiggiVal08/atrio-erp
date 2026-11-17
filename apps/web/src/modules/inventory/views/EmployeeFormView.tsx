import { useEffect, useMemo, useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useSetupEmployee,
  useEmployee,
  useUpdateEmployee,
  useDepartments,
  usePositions,
  useEmployeePaymentDetails,
  useSaveEmployeePaymentDetails,
  useClearEmployeePaymentDetails,
  useEmployeeEmploymentRelationships,
  useCurrentCompensation,
  useAdjustCompensation,
} from '../hooks/useEmployees';
import {
  applyServerErrors,
  clearServerErrors,
  FormDocumentInput,
  FormInput,
  FormPhoneInput,
  FormSelect,
  resolveServerErrorMessage,
} from '@/shared/form';
import {
  createEmployeeFormSchema,
  employeePaymentFormSchema,
  type EmployeeFormValues,
  type EmployeePaymentFormValues,
} from '@/shared/validation/employee-form';

const contractTypes = [
  { value: 'FULL_TIME', label: 'Tiempo completo' },
  { value: 'PART_TIME', label: 'Medio tiempo' },
  { value: 'FIXED_TERM', label: 'Plazo fijo' },
  { value: 'TEMPORARY', label: 'Temporal' },
  { value: 'INTERNSHIP', label: 'Pasantía' },
  { value: 'PROBATION', label: 'Prueba' },
];

const currencies = [
  { value: 'USD', label: 'USD' },
  { value: 'VED', label: 'VED' },
  { value: 'EUR', label: 'EUR' },
];

const emptyForm: EmployeeFormValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  secondLastName: '',
  identificationType: '',
  identityDoc: '',
  taxIdentifier: '',
  phone: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  hireDate: '',
  baseSalary: undefined,
  contractType: 'FULL_TIME',
  contractEndDate: '',
  reason: 'NEW_HIRE',
  selectedDeptId: '',
  newDeptName: '',
  selectedPosId: '',
  newPosName: '',
  currency: 'USD',
  compensationEffectiveDate: '',
  compensationReason: '',
};

const emptyPaymentForm: EmployeePaymentFormValues = {
  method: 'BANK',
  bankName: '',
  accountType: 'CHECKING',
  accountNumber: '',
  mobilePaymentPhone: '',
};

export function EmployeeFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: employee, isLoading: empLoading } = useEmployee(id ?? '');
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { data: relationships = [], isLoading: relationshipsLoading } =
    useEmployeeEmploymentRelationships(isEdit ? id ?? '' : '');
  const activeRelationship = relationships.find((item) => item.status === 'ACTIVE') ?? relationships[0];
  const {
    data: currentCompensation,
    isLoading: compensationLoading,
  } = useCurrentCompensation(activeRelationship?.id);
  const adjustCompensation = useAdjustCompensation(activeRelationship?.id);
  const setupEmp = useSetupEmployee();
  const updateEmp = useUpdateEmployee();
  const { data: paymentDetails, isLoading: paymentDetailsLoading, isError: paymentDetailsLoadError } =
    useEmployeePaymentDetails(isEdit ? id ?? '' : '');
  const savePaymentDetails = useSaveEmployeePaymentDetails(id ?? '');
  const clearPaymentDetails = useClearEmployeePaymentDetails(id ?? '');

  const [showNewDept, setShowNewDept] = useState(false);
  const [showNewPos, setShowNewPos] = useState(false);
  const [serverError, setServerError] = useState('');
  const [setupId] = useState(() => crypto.randomUUID());

  const originalSalary = Number(
    currentCompensation?.components?.find((component) => component.type === 'SALARY')?.amount ??
      employee?.baseSalary ??
      0,
  );
  const employeeSchema = useMemo(
    () => createEmployeeFormSchema({ isEdit, originalSalary }),
    [isEdit, originalSalary],
  );

  const form = useForm({
    defaultValues: emptyForm,
    validators: { onSubmit: employeeSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      const salaryAmount = Number(value.baseSalary);

      if (isEdit && id) {
        const identity = {
          id,
          firstName: value.firstName,
          middleName: value.middleName || undefined,
          lastName: value.lastName,
          secondLastName: value.secondLastName || undefined,
          identityDoc: value.identityDoc,
          identificationType: value.identificationType || undefined,
          taxIdentifier: value.taxIdentifier.trim() || undefined,
          phone: value.phone || undefined,
          email: value.email.trim() || undefined,
          address: value.address.trim() || undefined,
          emergencyContactName: value.emergencyContactName.trim() || undefined,
          emergencyContactPhone: value.emergencyContactPhone || undefined,
          hireDate: value.hireDate,
        };

        const originalComponent = currentCompensation?.components?.find(
          (component) => component.type === 'SALARY',
        )?.amount;
        const salaryChanged = originalComponent !== undefined
          ? Number(originalComponent) !== salaryAmount
          : Number(employee?.baseSalary ?? 0) !== salaryAmount;

        try {
          if (salaryChanged) {
            if (!currentCompensation?.id) {
              setServerError('No se encontró un acuerdo de compensación vigente.');
              return;
            }
            await adjustCompensation.mutateAsync({
              agreementId: currentCompensation.id,
              effectiveDate: value.compensationEffectiveDate,
              currency: currentCompensation.currency ?? value.currency,
              reason: value.compensationReason,
              components: [{ type: 'SALARY', amount: salaryAmount }],
            });
          }
          await updateEmp.mutateAsync(identity);
          navigate('/employees');
        } catch (error) {
          const result = applyServerErrors(form, error);
          setServerError(resolveServerErrorMessage(result, ''));
        }
        return;
      }

      setupEmp.mutate(
        {
          ...(showNewDept
            ? { department: { name: value.newDeptName.trim() } }
            : { departmentId: value.selectedDeptId }),
          ...(showNewPos
            ? { position: { name: value.newPosName.trim(), code: value.newPosName.trim().toUpperCase().replace(/\s+/g, '-') } }
            : { positionId: value.selectedPosId }),
          employee: {
            id: setupId,
            firstName: value.firstName,
            middleName: value.middleName || undefined,
            lastName: value.lastName,
            secondLastName: value.secondLastName || undefined,
            identityDoc: value.identityDoc,
            identificationType: value.identificationType || undefined,
            taxIdentifier: value.taxIdentifier.trim() || undefined,
            phone: value.phone || undefined,
            email: value.email.trim() || undefined,
            address: value.address.trim() || undefined,
            emergencyContactName: value.emergencyContactName.trim() || undefined,
            emergencyContactPhone: value.emergencyContactPhone || undefined,
            hireDate: value.hireDate,
            baseSalary: salaryAmount,
          },
          employment: { startDate: value.hireDate, reason: value.reason },
          contract: {
            contractType: value.contractType,
            startDate: value.hireDate,
            ...(value.contractEndDate ? { endDate: value.contractEndDate } : {}),
          },
          compensation: {
            effectiveDate: value.hireDate,
            currency: value.currency,
            components: [{ type: 'SALARY', amount: salaryAmount }],
          },
        },
        {
          onSuccess: () => navigate('/employees'),
          onError: (error) => {
            const result = applyServerErrors(form, error);
            setServerError(resolveServerErrorMessage(result, ''));
          },
        },
      );
    },
  });

  const paymentForm = useForm({
    defaultValues: emptyPaymentForm,
    validators: { onSubmit: employeePaymentFormSchema },
    onSubmit: ({ value }) => {
      if (!id) return;
      savePaymentDetails.mutate({
        method: value.method,
        ...(value.method === 'BANK'
          ? {
              bankName: value.bankName.trim(),
              accountType: value.accountType,
              accountNumber: value.accountNumber.trim(),
            }
          : {}),
        mobilePaymentPhone: value.mobilePaymentPhone || undefined,
      });
    },
  });

  const selectedDeptId = useStore(form.store, (state) => state.values.selectedDeptId);
  const contractType = useStore(form.store, (state) => state.values.contractType);
  const paymentMethod = useStore(paymentForm.store, (state) => state.values.method);

  useEffect(() => {
    if (!employee) return;
    clearServerErrors(form);
    form.reset(
      {
        ...emptyForm,
        firstName: employee.firstName ?? '',
        middleName: employee.middleName ?? '',
        lastName: employee.lastName ?? '',
        secondLastName: employee.secondLastName ?? '',
        identificationType: employee.identificationType ?? '',
        identityDoc: employee.identityDoc ?? '',
        taxIdentifier: employee.taxIdentifier ?? '',
        phone: employee.phone ?? '',
        email: employee.email ?? '',
        address: employee.address ?? '',
        emergencyContactName: employee.emergencyContactName ?? '',
        emergencyContactPhone: employee.emergencyContactPhone ?? '',
        hireDate: employee.hireDate.split('T')[0],
        baseSalary: Number(employee.baseSalary),
        currency: currentCompensation?.currency ?? 'USD',
      },
      { keepDefaultValues: true },
    );
  }, [employee, form, currentCompensation?.currency]);

  useEffect(() => {
    if (!currentCompensation) return;
    const salary = currentCompensation.components?.find((component) => component.type === 'SALARY');
    if (salary) form.setFieldValue('baseSalary', Number(salary.amount));
    if (currentCompensation.currency) form.setFieldValue('currency', currentCompensation.currency);
  }, [currentCompensation, form]);

  useEffect(() => {
    if (paymentDetails === undefined) return;
    paymentForm.reset(
      {
        method: paymentDetails?.method ?? 'BANK',
        bankName: paymentDetails?.bankName ?? '',
        accountType: paymentDetails?.accountType ?? 'CHECKING',
        accountNumber: paymentDetails?.accountNumber ?? '',
        mobilePaymentPhone: paymentDetails?.mobilePaymentPhone ?? '',
      },
      { keepDefaultValues: true },
    );
  }, [paymentDetails, paymentForm]);

  const isPending = setupEmp.isPending || updateEmp.isPending || adjustCompensation.isPending;
  const saveFailed = setupEmp.isError || updateEmp.isError || adjustCompensation.isError;

  const filteredPositions = positions.filter((p) => p.departmentId === selectedDeptId);

  const handleClearPaymentDetails = () => {
    if (id && paymentDetails && confirm(t('hr.employee.confirmClearPaymentDetails'))) {
      clearPaymentDetails.mutate();
    }
  };

  if (isEdit && empLoading) {
    return <ModuleSkeleton moduleName={t('hr.employee.edit')} />;
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">
          {isEdit ? t('hr.employee.edit') : t('hr.employee.create')}
        </h1>
        <button
          onClick={() => navigate('/employees')}
          className="rounded-lg border border-border px-4 py-1.5 text-xs text-text-secondary hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Personal Information */}
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-bold text-text-primary">Información Personal</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormInput form={form} name="firstName" label="Primer Nombre" required />
            <FormInput form={form} name="middleName" label="Otros Nombres" />
            <FormInput form={form} name="lastName" label="Primer Apellido" required />
            <FormInput form={form} name="secondLastName" label="Segundo Apellido" />
          </div>

          {isEdit && (
            <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <div>
                <h2 className="text-sm font-bold text-text-primary">{t('hr.employee.paymentDetails')}</h2>
                <p className="mt-1 text-xs text-text-secondary">{t('hr.employee.paymentDetailsHistoryHelp')}</p>
              </div>
              {paymentDetailsLoading ? (
                <p role="status" className="text-xs text-text-secondary">{t('common.loading')}</p>
              ) : paymentDetailsLoadError ? (
                <p role="alert" className="text-xs text-error">{t('hr.employee.paymentDetailsError')}</p>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void paymentForm.handleSubmit();
                  }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <FormSelect
                    form={paymentForm}
                    name="method"
                    label={t('hr.employee.paymentMethod')}
                    className="sm:col-span-2"
                    options={[
                      { value: 'BANK', label: t('hr.employee.paymentMethods.BANK') },
                      { value: 'MOBILE_PAYMENT', label: t('hr.employee.paymentMethods.MOBILE_PAYMENT') },
                    ]}
                  />
                  {paymentMethod === 'BANK' && (
                    <>
                      <FormInput
                        form={paymentForm}
                        name="bankName"
                        label={t('hr.employee.bankName')}
                        required
                        maxLength={120}
                      />
                      <FormSelect
                        form={paymentForm}
                        name="accountType"
                        label={t('hr.employee.accountType')}
                        options={(['SAVINGS', 'CHECKING', 'OTHER'] as const).map((type) => ({
                          value: type,
                          label: t(`hr.employee.accountTypes.${type}`),
                        }))}
                      />
                      <FormInput
                        form={paymentForm}
                        name="accountNumber"
                        label={t('hr.employee.accountNumber')}
                        required
                        maxLength={80}
                        autoComplete="off"
                      />
                      <FormPhoneInput
                        form={paymentForm}
                        name="mobilePaymentPhone"
                        label={t('hr.employee.mobilePaymentPhone')}
                        defaultCountry="VE"
                      />
                    </>
                  )}
                  {paymentMethod === 'MOBILE_PAYMENT' && (
                    <FormPhoneInput
                      form={paymentForm}
                      name="mobilePaymentPhone"
                      label={t('hr.employee.mobilePaymentPhone')}
                      required
                      defaultCountry="VE"
                      className="sm:col-span-2"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                    <button type="submit"
                      disabled={savePaymentDetails.isPending}
                      className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">
                      {savePaymentDetails.isPending ? t('common.loading') : t('hr.employee.savePaymentDetails')}
                    </button>
                    {paymentDetails && (
                      <button type="button" onClick={handleClearPaymentDetails}
                        disabled={clearPaymentDetails.isPending}
                        className="rounded-lg border border-border px-4 py-2 text-xs text-text-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50">
                        {clearPaymentDetails.isPending ? t('common.loading') : t('hr.employee.clearPaymentDetails')}
                      </button>
                    )}
                    {savePaymentDetails.isSuccess && (
                      <p role="status" className="text-xs text-success">{t('hr.employee.paymentDetailsSaved')}</p>
                    )}
                    {clearPaymentDetails.isSuccess && (
                      <p role="status" className="text-xs text-success">{t('hr.employee.paymentDetailsCleared')}</p>
                    )}
                  </div>
                  {(savePaymentDetails.isError || clearPaymentDetails.isError) && (
                    <p role="alert" className="text-xs text-error sm:col-span-2">
                      {t('hr.employee.paymentDetailsError')}
                    </p>
                  )}
                </form>
              )}
            </section>
          )}

          <FormDocumentInput
            form={form}
            name="identityDoc"
            identificationTypeName="identificationType"
            label={t('hr.employee.identityDoc')}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput form={form} name="taxIdentifier" label={t('hr.employee.taxIdentifier')} />
            <FormPhoneInput form={form} name="phone" label={t('hr.employee.phone')} defaultCountry="VE" />
            <FormInput form={form} name="email" label={t('hr.employee.email')} type="email" autoComplete="email" />
            <FormInput form={form} name="address" label={t('hr.employee.address')} multiline rows={2} className="sm:col-span-2" />
          </div>

          <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
            <legend className="px-1 text-xs font-semibold text-text-secondary">
              {t('hr.employee.emergencyContact')}
            </legend>
            <FormInput form={form} name="emergencyContactName" label={t('hr.employee.emergencyContactName')} autoComplete="off" />
            <FormPhoneInput
              form={form}
              name="emergencyContactPhone"
              label={t('hr.employee.emergencyContactPhone')}
              defaultCountry="VE"
            />
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <FormInput form={form} name="hireDate" label="Fecha de Ingreso" type="date" required />
            <div>
              {isEdit && (relationshipsLoading || compensationLoading) ? (
                <p role="status" className="text-xs text-text-secondary">{t('common.loading')}</p>
              ) : (
                <FormInput form={form} name="baseSalary" label="Salario Base" type="number" min={0} step={0.01} required />
              )}
            </div>
          </div>

          {isEdit && !relationshipsLoading && !compensationLoading && (
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                form={form}
                name="compensationEffectiveDate"
                label="Fecha Efectiva"
                type="date"
                required
              />
              <FormSelect
                form={form}
                name="compensationReason"
                label="Motivo de Compensación"
                required
                placeholder="Seleccionar motivo..."
                options={[
                  { value: 'SALARY_REVIEW', label: 'Revisión salarial' },
                  { value: 'MERIT_INCREASE', label: 'Aumento por mérito' },
                  { value: 'PROMOTION', label: 'Promoción' },
                  { value: 'OTHER', label: 'Otro' },
                ]}
              />
            </div>
          )}
        </div>

        {!isEdit && (
          <>
            {/* Department & Position */}
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-text-primary">Departamento y Cargo</h2>

              {showNewDept ? (
                <div className="flex items-end gap-2">
                  <FormInput
                    form={form}
                    name="newDeptName"
                    label="Departamento"
                    required
                    placeholder="Nombre del nuevo departamento"
                    autoFocus
                    className="flex-1"
                  />
                  <button type="button" onClick={() => { setShowNewDept(false); form.setFieldValue('newDeptName', ''); }}
                    className="mb-0.5 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <FormSelect
                    form={form}
                    name="selectedDeptId"
                    label="Departamento"
                    required
                    placeholder="Seleccionar departamento..."
                    onValueChange={() => form.setFieldValue('selectedPosId', '')}
                    options={departments.map((department) => ({ value: department.id, label: department.name }))}
                    className="flex-1"
                  />
                  <button type="button" onClick={() => { setShowNewDept(true); if (!form.state.values.selectedPosId) setShowNewPos(true); }}
                    className="mb-0.5 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover whitespace-nowrap">
                    + Nuevo
                  </button>
                </div>
              )}

              {showNewPos ? (
                <div className="flex items-end gap-2">
                  <FormInput
                    form={form}
                    name="newPosName"
                    label="Cargo"
                    required
                    placeholder="Nombre del nuevo cargo"
                    className="flex-1"
                  />
                  <button type="button" onClick={() => { setShowNewPos(false); form.setFieldValue('newPosName', ''); }}
                    className="mb-0.5 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <FormSelect
                    form={form}
                    name="selectedPosId"
                    label="Cargo"
                    required
                    placeholder="Seleccionar cargo..."
                    disabled={!selectedDeptId && !showNewDept}
                    options={filteredPositions.map((position) => ({ value: position.id, label: position.name }))}
                    className="flex-1"
                  />
                  <button type="button" onClick={() => setShowNewPos(true)}
                    className="mb-0.5 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover whitespace-nowrap">
                    + Nuevo
                  </button>
                </div>
              )}
            </div>

            {/* Employment */}
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-text-primary">Relación Laboral</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  form={form}
                  name="contractType"
                  label="Tipo de Contrato"
                  required
                  options={contractTypes}
                />
                {contractType === 'FIXED_TERM' && (
                  <FormInput form={form} name="contractEndDate" label="Fecha de Fin" type="date" required />
                )}
                <FormSelect
                  form={form}
                  name="reason"
                  label="Motivo"
                  options={[
                    { value: 'NEW_HIRE', label: 'Nuevo Ingreso' },
                    { value: 'TRANSFER', label: 'Transferencia' },
                    { value: 'PROMOTION', label: 'Promoción' },
                  ]}
                />
              </div>
            </div>

            {/* Compensation */}
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-text-primary">Compensación</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect form={form} name="currency" label="Moneda" options={currencies} />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pb-6">
          {serverError && (
            <p role="alert" className="mr-auto self-center text-xs text-error">
              {serverError}
            </p>
          )}
          {saveFailed && (
            <p role="alert" className="mr-auto self-center text-xs text-error">
              {t('hr.employee.saveFailed')}
            </p>
          )}
          <button
            type="button"
            onClick={() => void form.handleSubmit()}
            disabled={isPending}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
