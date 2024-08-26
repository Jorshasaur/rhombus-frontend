import axios from 'axios'
import { Asset } from '../interfaces/asset'

export const ApiHelper = {
    uploadAssets: async (assets: Asset[], files: File[]) => {
        const uploadPromises = assets.map((asset, index) => {
            const file = files[index]

            const config = {
                headers: {
                    'Content-Type': file.type
                }
            }

            return axios.post(asset.url, file, config)
        })

        await Promise.all(uploadPromises)
    }
}

export default ApiHelper
