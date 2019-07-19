import { $t } from '@/../shared/utils';

describe.only('localize methods', () => {
  it('method - $t', () => {
    const result = $t('advance.audioDelay');
    console.log(result);
  });
});
