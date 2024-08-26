declare module 'emoji-mart/dist/components/skins' {
    import {
        HandleSkinChange
    } from 'emoji-mart'
    export default class Skins extends React.Component {
        props: {
            skin: number
            onChange: HandleSkinChange
        }
    }
}

