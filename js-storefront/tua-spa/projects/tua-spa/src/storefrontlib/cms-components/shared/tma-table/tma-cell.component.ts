// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OutletContextData, TableDataOutletContext, TableFieldOptions } from '@spartacus/storefront';

@Component({
  selector: 'cx-selfcare-cell',
  templateUrl: './tma-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TmaCellComponent {
  constructor(protected outlet: OutletContextData<TableDataOutletContext>) {}

  get tabIndex(): number {
    return -1;
  }

  get model(): TableDataOutletContext {
    return this.outlet.context;
  }

  get property(): string {
    return this.model?.[this.outlet?.context?._field];
  }

  /**
   * Indicates wether the cell is linkable.
   *
   * If the cells is linkable, an anchor link is created to the detailed route
   * of the given `_type`.
   *
   * Defaults to `true`.
   */
  get linkable(): boolean {
    return this.property !== undefined && (this.cellOptions.linkable ?? true);
  }

  /**
   * Helper method to access the cell options.
   */
  get cellOptions(): TableFieldOptions {
    return (
      this.outlet.context?._options?.cells?.[this.outlet.context?._field] ?? {}
    );
  }

  /**
   * Generates the configurable route to the detail page of the given context item.
   */
  get route(): string {
    return this.outlet.context._type + 'Detail';
  }

  get routeModel(): any {
    return this.outlet.context;
  }

  get type(): string {
    return this.model._type;
  }

  /**
   * Indicates whether the item is loaded.
   */
  get hasItem(): boolean {
    return !!this.item && Object.keys(this.item).length > 0;
  }

  protected get item(): any {
    if (!this.outlet.context) {
      return null;
    }
    const { _field, _options, _type, _i18nRoot, ...all } = this.outlet.context;
    return all;
  }
}
