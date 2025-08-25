

export const metadata = {
    title: "About evolution",
};
export default async function About() {
    await new Promise(resolve => 
        setTimeout(() => {
            resolve("Internal Delay")
        }, 2000)
    )
    return <h1>About me</h1>
}