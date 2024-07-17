// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { TmaConsumptionConfig } from './tma-consumption-config';

export const defaultTmaConsumptionConfig: TmaConsumptionConfig = {
  consumption: {
    defaultValues: [
      { productSpecification: 'electricity', usageUnit: 'kwh', value: '1000' },
      { productSpecification: 'gas', usageUnit: 'cubic_meter', value: '1200' }
    ],
    default: '1000'
  }
};
