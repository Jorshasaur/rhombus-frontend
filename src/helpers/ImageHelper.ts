export function createImageToImageAnimation(
    startingImageSelector: string,
    endingImageSelector: string,
    onComplete?: () => void,
    transitionLength: number = 0.5
) {
    const startingImage = document.querySelector(
        startingImageSelector
    ) as HTMLImageElement
    const endingImage = document.querySelector(
        endingImageSelector
    ) as HTMLImageElement
    if (!startingImage || !endingImage) {
        if (typeof onComplete === 'function') {
            onComplete()
        }
        return
    }

    startingImage.style.visibility = 'hidden'
    endingImage.style.visibility = 'hidden'

    const animatingImage = startingImage.cloneNode() as HTMLImageElement
    const startingBounds = startingImage.getBoundingClientRect()
    const endingBounds = endingImage.getBoundingClientRect()
    const animationBezier = 'cubic-bezier(0.22, 0.61, 0.35, 1)'
    const style = `
                width: ${startingBounds.width}px;
                height: ${startingBounds.height}px;
                position: absolute;
                top: ${startingBounds.top}px;
                left: ${startingBounds.left}px;
                z-index: 100;
                transition: width ${animationBezier} ${transitionLength}s,
                    height ${animationBezier} ${transitionLength}s,
                    top ${animationBezier} ${transitionLength}s,
                    left ${animationBezier} ${transitionLength}s,
                    opacity ${animationBezier} ${transitionLength}s;
                will-change: width, height, top, left, opacity;
            `
    animatingImage.setAttribute('style', style)

    let animationComplete: () => void

    const cancel = () => {
        animatingImage.removeEventListener('transitionend', animationComplete)
        animatingImage.parentNode &&
            animatingImage.parentNode.removeChild(animatingImage)
        startingImage.style.visibility = 'visible'
        endingImage.style.visibility = 'visible'
    }

    animationComplete = () => {
        if (animatingImage) {
            cancel()
            if (typeof onComplete === 'function') {
                onComplete()
            }
        }
    }

    animatingImage.addEventListener('transitionend', animationComplete)

    // This is a fallback for if the transition fails somehow
    setTimeout(animationComplete, transitionLength * 1000 + 100)

    animatingImage.onload = () => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                if (animatingImage) {
                    animatingImage.style.width = `${endingBounds.width}px`
                    animatingImage.style.height = `${endingBounds.height}px`
                    animatingImage.style.top = `${endingBounds.top}px`
                    animatingImage.style.left = `${endingBounds.left}px`
                }
            })
        }, 0)
    }
    document.body.appendChild(animatingImage)
    return cancel
}
