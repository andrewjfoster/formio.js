'use strict';
import { ResourceComponent } from './Resource';
import { components as comps } from './fixtures/index';
import { Harness } from '../../../test/harness';
describe('Resource Component', function() {
  it('Should build a resource component', function(done) {
    Harness.testCreate(ResourceComponent, comps.comp1).then((component) => {
      Harness.testElements(component, 'select', 1);
      done();
    });
  });
});
