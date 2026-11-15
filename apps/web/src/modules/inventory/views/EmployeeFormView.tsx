import { useState, useEffect, type FormEvent } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
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
import { DocumentInput } from '@/shared/ui/DocumentInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';

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

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [secondLastName, setSecondLastName] = useState('');
  const [identificationType, setIdentificationType] = useState('');
  const [identityDoc, setIdentityDoc] = useState('');
  const [taxIdentifier, setTaxIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'MOBILE_PAYMENT'>('BANK');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CHECKING' | 'OTHER'>('CHECKING');
  const [accountNumber, setAccountNumber] = useState('');
  const [mobilePaymentPhone, setMobilePaymentPhone] = useState('');
  const [paymentValidationError, setPaymentValidationError] = useState(false);

  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [selectedPosId, setSelectedPosId] = useState('');
  const [newPosName, setNewPosName] = useState('');

  const [hireDate, setHireDate] = useState('');
  const [contractType, setContractType] = useState('FULL_TIME');
  const [contractEndDate, setContractEndDate] = useState('');
  const [reason, setReason] = useState('NEW_HIRE');

  const [baseSalary, setBaseSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [compensationEffectiveDate, setCompensationEffectiveDate] = useState('');
  const [compensationReason, setCompensationReason] = useState('');
  const [validationError, setValidationError] = useState('');
  const [setupId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!employee) return;
    setFirstName(employee.firstName);
    setMiddleName(employee.middleName ?? '');
    setLastName(employee.lastName);
    setSecondLastName(employee.secondLastName ?? '');
    setIdentificationType(employee.identificationType ?? '');
    setIdentityDoc(employee.identityDoc);
    setTaxIdentifier(employee.taxIdentifier ?? '');
    setPhone(employee.phone ?? '');
    setEmail(employee.email ?? '');
    setAddress(employee.address ?? '');
    setEmergencyContactName(employee.emergencyContactName ?? '');
    setEmergencyContactPhone(employee.emergencyContactPhone ?? '');
    setHireDate(employee.hireDate.split('T')[0]);
    setBaseSalary(String(Number(employee.baseSalary)));
  }, [employee]);

  useEffect(() => {
    if (!currentCompensation) return;
    const salary = currentCompensation.components?.find((component) => component.type === 'SALARY');
    if (salary) setBaseSalary(String(Number(salary.amount)));
    if (currentCompensation.currency) setCurrency(currentCompensation.currency);
  }, [currentCompensation]);

  useEffect(() => {
    if (paymentDetails === undefined) return;
    setPaymentMethod(paymentDetails?.method ?? 'BANK');
    setBankName(paymentDetails?.bankName ?? '');
    setAccountType(paymentDetails?.accountType ?? 'CHECKING');
    setAccountNumber(paymentDetails?.accountNumber ?? '');
    setMobilePaymentPhone(paymentDetails?.mobilePaymentPhone ?? '');
  }, [paymentDetails]);

  const isPending = setupEmp.isPending || updateEmp.isPending || adjustCompensation.isPending;
  const saveFailed = setupEmp.isError || updateEmp.isError || adjustCompensation.isError;

  const filteredPositions = positions.filter((p) => p.departmentId === selectedDeptId);

  const handleSave = async () => {
    setValidationError('');
    const salaryAmount = Number(baseSalary);

    if (!firstName || !lastName || !identityDoc || !hireDate) {
      setValidationError('Complete nombre, apellido, documento y fecha de ingreso.');
      return;
    }
    if (!baseSalary || !Number.isFinite(salaryAmount) || salaryAmount <= 0) {
      setValidationError('El salario base debe ser un valor mayor que cero.');
      return;
    }
    if (!isEdit && contractType === 'FIXED_TERM' && !contractEndDate) {
      setValidationError('El contrato a plazo fijo requiere fecha de fin.');
      return;
    }

    if (isEdit && id) {
      const identity = {
        id,
        firstName, middleName: middleName || undefined,
        lastName, secondLastName: secondLastName || undefined,
        identityDoc, identificationType: identificationType || undefined,
        taxIdentifier: taxIdentifier.trim() || undefined,
        phone: phone || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        hireDate,
      };

      const originalSalary = currentCompensation?.components?.find((component) => component.type === 'SALARY')?.amount;
      const salaryChanged = originalSalary !== undefined
        ? Number(originalSalary) !== salaryAmount
        : Number(employee?.baseSalary ?? 0) !== salaryAmount;

      try {
        if (salaryChanged) {
          if (!currentCompensation?.id) {
            setValidationError('No se encontró un acuerdo de compensación vigente.');
            return;
          }
          if (!compensationEffectiveDate) {
            setValidationError('Indique la fecha efectiva de la compensación.');
            return;
          }
          if (!compensationReason) {
            setValidationError('Indique el motivo de la compensación.');
            return;
          }
          await adjustCompensation.mutateAsync({
            agreementId: currentCompensation.id,
            effectiveDate: compensationEffectiveDate,
            currency: currentCompensation.currency ?? currency,
            reason: compensationReason,
            components: [{ type: 'SALARY', amount: salaryAmount }],
          });
        }
        await updateEmp.mutateAsync(identity);
        navigate('/employees');
      } catch {
        // mutation error state renders the failure alert
      }
      return;
    }

    if (!selectedDeptId && !newDeptName) {
      setValidationError('Seleccione un departamento o cree uno nuevo.');
      return;
    }
    if (!selectedPosId && !newPosName) {
      setValidationError('Seleccione un cargo o cree uno nuevo.');
      return;
    }

    setupEmp.mutate({
      ...(showNewDept ? { department: { name: newDeptName.trim() } } : { departmentId: selectedDeptId }),
      ...(showNewPos ? { position: { name: newPosName.trim(), code: newPosName.trim().toUpperCase().replace(/\s+/g, '-') } } : { positionId: selectedPosId }),
      employee: {
        id: setupId,
        firstName, middleName: middleName || undefined,
        lastName, secondLastName: secondLastName || undefined,
        identityDoc, identificationType: identificationType || undefined,
        taxIdentifier: taxIdentifier.trim() || undefined,
        phone: phone || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        hireDate,
        baseSalary: salaryAmount,
      },
      employment: { startDate: hireDate, reason },
      contract: { contractType, startDate: hireDate, ...(contractEndDate ? { endDate: contractEndDate } : {}) },
      compensation: {
        effectiveDate: hireDate, currency,
        components: [{ type: 'SALARY', amount: salaryAmount }],
      },
    }, { onSuccess: () => navigate('/employees') });
  };

  const handleSavePaymentDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    const bankDetailsInvalid = paymentMethod === 'BANK' && (!bankName.trim() || !accountNumber.trim());
    const mobileDetailsInvalid = paymentMethod === 'MOBILE_PAYMENT' && !mobilePaymentPhone.trim();
    if (bankDetailsInvalid || mobileDetailsInvalid) {
      setPaymentValidationError(true);
      return;
    }
    setPaymentValidationError(false);
    savePaymentDetails.mutate({
      method: paymentMethod,
      ...(paymentMethod === 'BANK' ? {
        bankName: bankName.trim(),
        accountType,
        accountNumber: accountNumber.trim(),
      } : {}),
      mobilePaymentPhone: mobilePaymentPhone || undefined,
    });
  };

  const handleClearPaymentDetails = () => {
    if (id && paymentDetails && confirm(t('hr.employee.confirmClearPaymentDetails'))) {
      clearPaymentDetails.mutate();
    }
  };

  const inputClass = 'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none';

  if (isEdit && empLoading) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.loading')}</div>;
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
            <div className="space-y-1.5">
              <label htmlFor="employee-first-name" className="text-xs font-medium text-text-secondary">Primer Nombre *</label>
              <input id="employee-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="employee-middle-name" className="text-xs font-medium text-text-secondary">Otros Nombres</label>
              <input id="employee-middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="employee-last-name" className="text-xs font-medium text-text-secondary">Primer Apellido *</label>
              <input id="employee-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="employee-second-last-name" className="text-xs font-medium text-text-secondary">Segundo Apellido</label>
              <input id="employee-second-last-name" value={secondLastName} onChange={(e) => setSecondLastName(e.target.value)} className={inputClass} />
            </div>
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
                <form onSubmit={handleSavePaymentDetails} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-xs font-medium text-text-secondary">{t('hr.employee.paymentMethod')}</span>
                    <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}
                      className={inputClass}>
                      <option value="BANK">{t('hr.employee.paymentMethods.BANK')}</option>
                      <option value="MOBILE_PAYMENT">{t('hr.employee.paymentMethods.MOBILE_PAYMENT')}</option>
                    </select>
                  </label>
                  {paymentMethod === 'BANK' && (
                    <>
                      <label className="space-y-1.5">
                        <span className="text-xs font-medium text-text-secondary">{t('hr.employee.bankName')} *</span>
                        <input required maxLength={120} value={bankName} onChange={(event) => setBankName(event.target.value)}
                          className={inputClass} />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-medium text-text-secondary">{t('hr.employee.accountType')}</span>
                        <select value={accountType} onChange={(event) => setAccountType(event.target.value as typeof accountType)}
                          className={inputClass}>
                          {(['SAVINGS', 'CHECKING', 'OTHER'] as const).map((type) => (
                            <option key={type} value={type}>{t(`hr.employee.accountTypes.${type}`)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-medium text-text-secondary">{t('hr.employee.accountNumber')} *</span>
                        <input required maxLength={80} autoComplete="off" value={accountNumber}
                          onChange={(event) => setAccountNumber(event.target.value)} className={inputClass} />
                      </label>
                      <PhoneInput value={mobilePaymentPhone} onChange={setMobilePaymentPhone}
                        label={t('hr.employee.mobilePaymentPhone')} defaultCountry="VE" />
                    </>
                  )}
                  {paymentMethod === 'MOBILE_PAYMENT' && (
                    <div className="sm:col-span-2">
                      <PhoneInput value={mobilePaymentPhone} onChange={setMobilePaymentPhone}
                        label={`${t('hr.employee.mobilePaymentPhone')} *`} defaultCountry="VE" />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                    <button type="submit"
                      disabled={savePaymentDetails.isPending ||
                        (paymentMethod === 'BANK' && (!bankName.trim() || !accountNumber.trim())) ||
                        (paymentMethod === 'MOBILE_PAYMENT' && !mobilePaymentPhone.trim())}
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
                  {paymentValidationError && (
                    <p role="alert" className="text-xs text-error sm:col-span-2">
                      {t('hr.employee.paymentDetailsRequired')}
                    </p>
                  )}
                </form>
              )}
            </section>
          )}

          <DocumentInput
            value={identityDoc}
            onChange={setIdentityDoc}
            identificationType={identificationType}
            onIdentificationTypeChange={setIdentificationType}
            label={`${t('hr.employee.identityDoc')} *`}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="employee-tax-id" className="text-xs font-medium text-text-secondary">
                {t('hr.employee.taxIdentifier')}
              </label>
              <input id="employee-tax-id" value={taxIdentifier} onChange={(e) => setTaxIdentifier(e.target.value)}
                className={inputClass} />
            </div>
            <PhoneInput value={phone} onChange={setPhone} label={t('hr.employee.phone')} defaultCountry="VE" />
            <div className="space-y-1.5">
              <label htmlFor="employee-email" className="text-xs font-medium text-text-secondary">
                {t('hr.employee.email')}
              </label>
              <input id="employee-email" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="employee-address" className="text-xs font-medium text-text-secondary">
                {t('hr.employee.address')}
              </label>
              <textarea id="employee-address" rows={2} value={address}
                onChange={(e) => setAddress(e.target.value)} className={inputClass} />
            </div>
          </div>

          <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
            <legend className="px-1 text-xs font-semibold text-text-secondary">
              {t('hr.employee.emergencyContact')}
            </legend>
            <div className="space-y-1.5">
              <label htmlFor="employee-emergency-name" className="text-xs font-medium text-text-secondary">
                {t('hr.employee.emergencyContactName')}
              </label>
              <input id="employee-emergency-name" autoComplete="off" value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)} className={inputClass} />
            </div>
            <PhoneInput value={emergencyContactPhone} onChange={setEmergencyContactPhone}
              label={t('hr.employee.emergencyContactPhone')} defaultCountry="VE" />
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="employee-hire-date" className="text-xs font-medium text-text-secondary">Fecha de Ingreso *</label>
              <input id="employee-hire-date" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="employee-base-salary" className="text-xs font-medium text-text-secondary">Salario Base *</label>
              {isEdit && (relationshipsLoading || compensationLoading) ? (
                <p role="status" className="text-xs text-text-secondary">{t('common.loading')}</p>
              ) : (
                <input id="employee-base-salary" type="number" min="0" step="0.01" value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)} className={inputClass} />
              )}
            </div>
          </div>

          {isEdit && !relationshipsLoading && !compensationLoading && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="employee-compensation-effective" className="text-xs font-medium text-text-secondary">Fecha Efectiva *</label>
                <input id="employee-compensation-effective" type="date" value={compensationEffectiveDate}
                  onChange={(e) => setCompensationEffectiveDate(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="employee-compensation-reason" className="text-xs font-medium text-text-secondary">Motivo de Compensación *</label>
                <select id="employee-compensation-reason" value={compensationReason}
                  onChange={(e) => setCompensationReason(e.target.value)} className={inputClass}>
                  <option value="">Seleccionar motivo...</option>
                  <option value="SALARY_REVIEW">Revisión salarial</option>
                  <option value="MERIT_INCREASE">Aumento por mérito</option>
                  <option value="PROMOTION">Promoción</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {!isEdit && (
          <>
            {/* Department & Position */}
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-text-primary">Departamento y Cargo</h2>

              <div className="space-y-1.5">
                <label htmlFor="employee-department" className="text-xs font-medium text-text-secondary">Departamento *</label>
                {showNewDept ? (
                  <div className="flex gap-2">
                    <input
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="Nombre del nuevo departamento"
                      className={`flex-1 ${inputClass}`}
                    />
                    <button onClick={() => { setShowNewDept(false); setNewDeptName(''); }}
                      className="rounded-lg border border-border px-3 text-xs text-text-secondary hover:bg-surface-hover">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select id="employee-department" value={selectedDeptId} onChange={(e) => { setSelectedDeptId(e.target.value); setSelectedPosId(''); }}
                      className={`flex-1 ${inputClass}`}>
                      <option value="">Seleccionar departamento...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <button onClick={() => { setShowNewDept(true); if (!selectedPosId) setShowNewPos(true); }}
                      className="rounded-lg border border-border px-3 text-xs text-text-secondary hover:bg-surface-hover whitespace-nowrap">
                      + Nuevo
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="employee-position" className="text-xs font-medium text-text-secondary">Cargo *</label>
                {showNewPos ? (
                  <div className="flex gap-2">
                    <input
                      value={newPosName}
                      onChange={(e) => setNewPosName(e.target.value)}
                      placeholder="Nombre del nuevo cargo"
                      className={`flex-1 ${inputClass}`}
                    />
                    <button onClick={() => { setShowNewPos(false); setNewPosName(''); }}
                      className="rounded-lg border border-border px-3 text-xs text-text-secondary hover:bg-surface-hover">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select id="employee-position" value={selectedPosId} onChange={(e) => setSelectedPosId(e.target.value)}
                      className={`flex-1 ${inputClass}`}
                      disabled={!selectedDeptId && !showNewDept}>
                      <option value="">Seleccionar cargo...</option>
                      {filteredPositions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button onClick={() => setShowNewPos(true)}
                      className="rounded-lg border border-border px-3 text-xs text-text-secondary hover:bg-surface-hover whitespace-nowrap">
                      + Nuevo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Employment */}
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-text-primary">Relación Laboral</h2>
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="employee-contract-type" className="text-xs font-medium text-text-secondary">Tipo de Contrato *</label>
                  <select id="employee-contract-type" value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputClass}>
                    {contractTypes.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
                {contractType === 'FIXED_TERM' && (
                  <div className="space-y-1.5">
                    <label htmlFor="employee-contract-end-date" className="text-xs font-medium text-text-secondary">Fecha de Fin *</label>
                    <input id="employee-contract-end-date" type="date" value={contractEndDate}
                      onChange={(e) => setContractEndDate(e.target.value)} className={inputClass} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="employee-employment-reason" className="text-xs font-medium text-text-secondary">Motivo</label>
                  <select id="employee-employment-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
                    <option value="NEW_HIRE">Nuevo Ingreso</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="PROMOTION">Promoción</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-text-primary">Compensación</h2>
              <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Moneda</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                    {currencies.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pb-6">
          {validationError && (
            <p role="alert" className="mr-auto self-center text-xs text-error">
              {validationError}
            </p>
          )}
          {saveFailed && (
            <p role="alert" className="mr-auto self-center text-xs text-error">
              {t('hr.employee.saveFailed')}
            </p>
          )}
          <button
            onClick={handleSave}
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
