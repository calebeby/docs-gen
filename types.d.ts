declare module 'pkg-dir' {
  function pkgDir(cwd?: string): Promise<null | string>
  export default pkgDir
}
