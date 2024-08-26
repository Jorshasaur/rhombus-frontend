import { connect } from 'react-redux'
import ExpandedImage from './ExpandedImage'

import { RootState } from '../../../../data/reducers'
import { imagesSelectors, imagesActionCreators } from '../../../../data/images'

const mapStateToProps = (state: RootState) => ({
    activeImageId: imagesSelectors.getActiveImageId(state),
    imageCarousel: imagesSelectors.getImageCarousel(state),
    activeImageInfo: imagesSelectors.getActiveImageInfo(state)
})

const mapDispatchToProps = {
    nextImage: imagesActionCreators.nextImage,
    previousImage: imagesActionCreators.previousImage,
    clearActiveImage: imagesActionCreators.clearActiveImage
}

export default connect(mapStateToProps, mapDispatchToProps)(ExpandedImage)
