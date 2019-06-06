import { recentPlayService } from '@/services/media/RecentPlayService';

describe.only('RecentPlayService', () => {
  describe('method - setPlaylist', () => {
    it('setPlaylist', async () => {
      const result = await recentPlayService.setPlaylist();
      console.log(result);
    });
  });
});
