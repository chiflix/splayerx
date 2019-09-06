import ThumbnailService from '../../../../../src/renderer/services/media/ThumbnailService';

describe('thumbnaiService logic service', () => {
  let thumbnailService;

  describe('calculateThumbnailPosition', () => {
    beforeEach(() => {
      thumbnailService = new ThumbnailService();
    });

    it('should return right result', () => {
      expect(thumbnailService.calculateThumbnailPosition(234, 1, 20))
        .to.have.ordered.members([14, 11]);
      expect(thumbnailService.calculateThumbnailPosition(234, 2, 20))
        .to.have.ordered.members([17, 5]);
      expect(thumbnailService.calculateThumbnailPosition(234, 5, 10))
        .to.have.ordered.members([7, 4]);
    });
  });
});
