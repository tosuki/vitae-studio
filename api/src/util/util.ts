import fs from "node:fs/promises"

const exists = async (path: string, create: boolean = false): Promise<boolean> => {
    try {
        await fs.access(path);

        return true;
    } catch (error: any) {
        switch (error.code) {
            case 'EACCES':
            case 'EPERM':
                throw new Error(`Não foi possivel realizar o acesso ao diretório ${path} devido a problemas de permissão.`)
            case 'ENOENT':
                if (create) {
                    await fs.mkdir(path)
                    return true
                }

                return false

        }

        throw error
    }
}

export default { exists }