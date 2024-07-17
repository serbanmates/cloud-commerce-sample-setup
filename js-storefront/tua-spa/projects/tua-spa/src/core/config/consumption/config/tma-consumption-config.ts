// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { TmaConsumptionValue } from '../../../model';

export abstract class TmaConsumptionConfig {
  consumption?: {
    defaultValues: TmaConsumptionValue[];
    default: string;
  };
}

declare module '@spartacus/core' {
  interface Config extends TmaConsumptionConfig {}
}
