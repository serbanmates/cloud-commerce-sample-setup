// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { LayoutConfig } from '@spartacus/storefront';

export const tmaB2cLayoutConfig: LayoutConfig = {
  layoutSlots: {
    GuidedSellingPageTemplate: {
      slots: ['GuidedSellingContentSlot']
    },
    SelfcarePageTemplate: {
      slots: ['BodyContent', 'SideContent']
    }
  }
};
