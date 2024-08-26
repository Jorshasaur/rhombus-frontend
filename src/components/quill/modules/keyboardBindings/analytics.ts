import StyleChangeAnalytics from '../../../../analytics/AnalyticsBuilders/StyleChangeAnalytics'
import { keycodes } from '../../../../interfaces/keycodes'
import { Binding } from '../Keyboard'

export function addBindingsForAnalytics(bindings: Binding[][]) {
    // tracking for Bold
    bindings[keycodes.B].unshift({
        key: keycodes.B,
        shortKey: true,
        shiftKey: false,
        handler: function() {
            new StyleChangeAnalytics()
                .viaKeyboard()
                .appliedBold()
                .track()
            return true
        }
    })

    // tracking for Italic
    bindings[keycodes.I].unshift({
        key: keycodes.I,
        shortKey: true,
        shiftKey: false,
        handler: function() {
            new StyleChangeAnalytics()
                .viaKeyboard()
                .appliedItalics()
                .track()
            return true
        }
    })

    // tracking for Underline
    bindings[keycodes.U].unshift({
        key: keycodes.U,
        shortKey: true,
        shiftKey: false,
        handler: function() {
            new StyleChangeAnalytics()
                .viaKeyboard()
                .appliedUnderline()
                .track()
            return true
        }
    })
}
