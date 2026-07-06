import puppeteer from "puppeteer"
import utils from "../util/util"
import fs from "node:fs/promises"
import env from "../env"

import { LINKEDIN_LOGIN_PAGE } from "../util/constants"

/**
 * A ideia desse script é facilitar a coleta de cookies do Linkedin
 * Será aberto um navegador com a página do Linkedin aberta, você deve fazer login
 * e apertar Enter, o cookie será salvo na pasta resources
 */
export async function authenticate() {
    const browser = await puppeteer.launch({
        headless: false
    })

    const page = await browser.newPage()
    await page.goto(LINKEDIN_LOGIN_PAGE);

    console.log("Depois de autenticado, pressione qualquer tecla.")

    await new Promise<void>((resolve, _) => {
        process.stdin.on("data", (data) => {
            console.log(`Input ${data}`)
            resolve();
        })
    })

    const cookies = await browser.cookies()

    if (!(await utils.exists(env.RESOURCES_DIR, true))) {
        throw new Error(`Não foi possivel realizar o diretório ${env.RESOURCES_DIR}`)
    }

    const cookiesPathname = `${env.RESOURCES_DIR}/linkedin_${Date.now()}.json`
    await fs.writeFile(cookiesPathname, JSON.stringify(cookies))

    console.log(`Cookies salvos no diretório ${cookiesPathname}`)
    await page.close()
    await browser.close()
}

authenticate()
    .catch((error) => {
        console.error(error)
    }).finally(() => {
        process.exit(0)
    })