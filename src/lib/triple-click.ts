document.addEventListener('click', (event: MouseEvent) => {
    if (event.detail === 3) {
        const tripleClick = new CustomEvent('tripleclick', {
            bubbles: true
        })

        event.target && event.target.dispatchEvent(tripleClick)
    }
})

export const foo = 'foo'
