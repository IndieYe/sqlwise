import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setInitEnvData } from '../store/slices/appSlice'
import { useAsyncEffect } from 'ahooks'

const useEnvService = () => {
    const dispatch = useAppDispatch()
    const envReady = useAppSelector(state => state.app.envReady)
    const envData = useAppSelector(state => state.app.envData)

    // Initial read envData
    useEffect(() => {
        const savedEnvData = localStorage.getItem('envData')
        let parsedData = undefined
        if (savedEnvData) {
            try {
                parsedData = JSON.parse(savedEnvData)
            } catch (error) {
                console.error('Failed to parse envData from localStorage:', error)
            }
        }

        dispatch(setInitEnvData(parsedData))
        console.log('[envData] loaded:', parsedData)
    }, [])

    // If envData changes, save it to localStorage
    useAsyncEffect(async () => {
        if (envReady) {
            console.log('[envData] saved:', envData)
            localStorage.setItem('envData', JSON.stringify(envData))
        }
    }, [envData])
}

export default useEnvService