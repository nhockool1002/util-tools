declare module "fontverter" {
  const fontverter: {
    convert(input: any, targetFormat: string): Promise<any>;
  };

  export default fontverter;
}
