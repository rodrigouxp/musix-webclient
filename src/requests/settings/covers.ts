import { paths } from '@/config'
import { NotifType, useToast } from '@/stores/notification'
import { useT } from '@/i18n'
import useAxios from '../useAxios'

const { t } = useT()

export async function refreshAllCovers() {
    const { error } = await useAxios({
        url: paths.api.settings.refreshCovers,
        method: 'POST',
    })

    if (error) {
        useToast().showNotification(t('Requests.Album.UpdateAllCoversError'), NotifType.Error)
        return
    }

    useToast().showNotification(t('Requests.Album.UpdatingAllCovers'), NotifType.Success)
}
