import fs from "node:fs/promises"
import utils from "./util"
import env from "../env"

export const getNewestCookies = async (name: string) => {
    if (!(await utils.exists(env.RESOURCES_DIR, true))) {
        throw new Error(`Não foi possivel realizar o acesso ao diretório ${env.RESOURCES_DIR}`)
    }

    try {
        const files = await fs.readdir(env.RESOURCES_DIR)

        const filteredFiles = files
            .map((file) => {
                const parts = file.replace(/\.[^/.]+$/, '').split('_')

                return {
                    fullName: file,
                    name: parts[0],
                    timestamp: parts[1] ? Number(parts[1]) : null
                }
            })
            .filter((file): file is { fullName: string, name: string; timestamp: number } => file.name === name && file.timestamp !== null && !isNaN(file.timestamp))
            .sort((a, b) => a.timestamp - b.timestamp)

        if (filteredFiles.length < 1) {
            return null
        }

        const latestCookiefile = filteredFiles[0]
        const fileContent = await fs.readFile(`${env.RESOURCES_DIR}/${latestCookiefile.fullName}`, 'utf-8')

        return JSON.parse(fileContent)
    } catch (error: any) {
        switch (error.code) {
            case 'EACCES':
            case 'EPERM':
                throw new Error(`Não foi possivel realizar o acesso ao diretório ${env.RESOURCES_DIR} devido a problemas de permissão.`)
            case 'ENOENT':
                return false
        }

        throw error
    }
}

export const saveCookies = async (name: string, cookies: any[]) => {
    if (!(await utils.exists(env.RESOURCES_DIR, true))) {
        throw new Error(`Não foi possivel realizar o acesso ao diretório ${env.RESOURCES_DIR}`)
    }

    const cookiesFilePath = `${env.RESOURCES_DIR}/${name}_${Date.now()}.json`

    try {
        await fs.writeFile(cookiesFilePath, JSON.stringify(cookies))
    } catch (error: any) {
        if (error.code !== "EPERM" || error.code !== "EACCES") {
            throw new Error(`Não foi possivel salvar os cookies ${cookiesFilePath} devido a falta de permissão.`)
        }

        throw error
    }
}