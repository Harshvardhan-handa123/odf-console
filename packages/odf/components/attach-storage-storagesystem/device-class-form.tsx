import * as React from 'react';
import {
  fieldRequirementsTranslations,
  formSettings,
} from '@odf/shared/constants';
import { TextInputWithFieldRequirements } from '@odf/shared/input-with-requirements';
import { DeviceSet } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import validationRegEx from '@odf/shared/utils/validation';
import { useYupValidationResolver } from '@odf/shared/yup-validation-resolver';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import {
  AttachStorageAction,
  AttachStorageActionType,
  AttachStorageFormState,
} from './state';

type DeviceClassFormProps = {
  state: AttachStorageFormState;
  dispatch: React.Dispatch<AttachStorageAction>;
  deviceSets: DeviceSet[];
  placeholderText: string;
};

const DeviceClassForm: React.FC<DeviceClassFormProps> = ({
  state,
  dispatch,
  deviceSets,
  placeholderText,
}) => {
  const { t } = useCustomTranslation();

  const existingDeviceClasses = React.useMemo(() => {
    if (!state.lsoStorageClassName) return [];

    return deviceSets
      .filter(
        (ds) =>
          ds.dataPVCTemplate?.spec?.storageClassName ===
            state.lsoStorageClassName && ds.deviceClass
      )
      .map((ds) => ds.deviceClass);
  }, [deviceSets, state.lsoStorageClassName]);

  const deviceClassMaxLength = 253;
  const { schema, fieldRequirements } = React.useMemo(() => {
    const translationFieldRequirements = [
      fieldRequirementsTranslations.maxChars(t, deviceClassMaxLength),
      fieldRequirementsTranslations.startAndEndName(t),
      fieldRequirementsTranslations.alphaNumericPeriodAdnHyphen(t),
      fieldRequirementsTranslations.uniqueDeviceClass(t),
    ];

    const validationSchema = Yup.object({
      deviceClassName: Yup.string()
        .required()
        .max(deviceClassMaxLength, translationFieldRequirements[0])
        .matches(
          validationRegEx.startAndEndsWithAlphanumerics,
          translationFieldRequirements[1]
        )
        .matches(
          validationRegEx.alphaNumericsPeriodsHyphensNonConsecutive,
          translationFieldRequirements[2]
        )
        .test(
          'unique-device-class',
          translationFieldRequirements[3],
          (value: string) => {
            if (!value) return true;
            const isDuplicate = existingDeviceClasses.includes(value);
            return !isDuplicate;
          }
        ),
    });

    return {
      schema: validationSchema,
      fieldRequirements: translationFieldRequirements,
    };
  }, [existingDeviceClasses, t]);

  const resolver = useYupValidationResolver(schema);
  const {
    formState: { errors },
    control,
    watch,
  } = useForm({
    ...formSettings,
    resolver,
  });

  const deviceClassName: string = watch('deviceClassName');

  React.useEffect(() => {
    const payload = errors?.deviceClassName ? '' : deviceClassName;
    dispatch({
      type: AttachStorageActionType.SET_DEVICE_CLASS,
      payload: payload || '',
    });
  }, [deviceClassName, dispatch, errors?.deviceClassName]);

  return (
    <TextInputWithFieldRequirements
      control={control}
      fieldRequirements={fieldRequirements}
      popoverProps={{
        headerContent: t('Device class requirements'),
        footerContent: t('Example: ssd'),
      }}
      formGroupProps={{
        label: t('Device class'),
        fieldId: 'device-class',
        className: 'pf-v5-u-py-sm',
        isRequired: true,
      }}
      textInputProps={{
        id: 'device-class',
        name: 'deviceClassName',
        'data-test': 'device-class-textbox',
        'aria-describedby': t('device-class-help'),
        placeholder: placeholderText,
      }}
    />
  );
};

export default DeviceClassForm;
