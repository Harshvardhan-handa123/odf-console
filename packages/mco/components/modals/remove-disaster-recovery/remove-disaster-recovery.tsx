import * as React from 'react';
import { DO_NOT_DELETE_PVC_ANNOTATION_WO_SLASH } from '@odf/mco/constants';
import { DRPlacementControlKind } from '@odf/mco/types';
import { ACMPlacementModel, DRPlacementControlModel } from '@odf/shared';
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  CommonModalProps,
} from '@odf/shared/modals';
import { getName, getNamespace } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { getErrorMessage } from '@odf/shared/utils';
import {
  K8sResourceKind,
  k8sDelete,
  k8sPatch,
} from '@openshift-console/dynamic-plugin-sdk';
import { Trans } from 'react-i18next';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

// ToDo(Gowtham): https://github.com/red-hat-storage/odf-console/issues/1449
const pvcAnnotationPatchPromise = (application: DRPlacementControlKind) => {
  const patch = [
    {
      op: 'add',
      path: `/metadata/annotations/${DO_NOT_DELETE_PVC_ANNOTATION_WO_SLASH}`,
      value: 'true',
    },
  ];

  return k8sPatch({
    model: DRPlacementControlModel,
    resource: {
      metadata: {
        name: getName(application),
        namespace: getNamespace(application),
      },
    },
    data: patch,
  });
};

// ToDo(Gowtham): https://github.com/red-hat-storage/odf-console/issues/1449
const deleteApplicationResourcePromise = (
  application: DRPlacementControlKind
) => {
  // Delete DRPC and dummy placement after updating the annotation
  const promises: Promise<K8sResourceKind>[] = [];
  const { name, namespace } = application?.spec?.placementRef;

  promises.push(
    k8sDelete({
      resource: application,
      model: DRPlacementControlModel,
      json: null,
      requestInit: null,
    })
  );

  promises.push(
    k8sDelete({
      resource: {
        metadata: {
          name: name,
          namespace: namespace,
        },
      },
      model: ACMPlacementModel,
      json: null,
      requestInit: null,
    })
  );

  return promises;
};

const RemoveDisasterRecoveryModal: React.FC<
  CommonModalProps<RemoveDisasterRecoveryProps>
> = ({ closeModal, isOpen, extraProps: { application } }) => {
  const { t } = useCustomTranslation();

  const [isInprogress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState();

  const onRemove = (event) => {
    event.preventDefault();
    setInProgress(true);

    pvcAnnotationPatchPromise(application)
      .then(() => {
        Promise.all(deleteApplicationResourcePromise(application))
          .then(() => {
            closeModal();
          })
          .catch((err) => {
            setError(err);
            setInProgress(false);
          });
      })
      .catch((err) => {
        setError(err);
        setInProgress(false);
      });
  };

  return (
    <Modal
      variant={ModalVariant.small}
      header={
        <ModalHeader>
          <ExclamationTriangleIcon
            color="var(--pf-v5-global--warning-color--100)"
            className="icon--spacer"
          />
          {t('Remove disaster recovery?')}
        </ModalHeader>
      }
      isOpen={isOpen}
      onClose={closeModal}
      showClose={false}
      hasNoBodyWrapper={true}
    >
      <ModalBody>
        <Trans t={t}>
          Your application{' '}
          <strong>{{ resourceName: getName(application) }}</strong> will lose
          disaster recovery protection, reventing volume synchronization
          (replication) between clusters.
        </Trans>
        {!!error && (
          <Alert
            isInline
            variant={AlertVariant.danger}
            title={t('An error occurred')}
          >
            {getErrorMessage(error) || error}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          key="cancel"
          variant={ButtonVariant.secondary}
          onClick={closeModal}
          data-test="cancel-action"
        >
          {t('Cancel')}
        </Button>
        <Button
          key="remove"
          variant={ButtonVariant.danger}
          onClick={onRemove}
          data-test="remove-action"
          isLoading={isInprogress}
        >
          {t('Remove')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

type RemoveDisasterRecoveryProps = {
  application: DRPlacementControlKind;
};

export default RemoveDisasterRecoveryModal;
